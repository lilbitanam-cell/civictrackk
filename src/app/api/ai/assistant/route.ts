import dns from "dns";
import { NextRequest, NextResponse } from "next/server";
import { getPublicCivicStoryDetailServer } from "@/services/server/complaints.server";

export const runtime = "nodejs";

// Prefer IPv4 on dual-stack Windows/Node environments to avoid IPv6 connect stalls
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore on runtimes where DNS order is immutable
}

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_INSTRUCTION = `You are the CivicTrack Civic Helpdesk — a polite, concise, accurate public-service assistant for CivicTrack ("The Civic Journal").

Your responsibilities:
1. Help residents report municipal issues clearly by recommending the right category and drafting concise report titles & descriptions they can paste into the report form.
2. Explain CivicTrack's transparent 5-stage workflow:
   - Submitted -> Under Review -> Assigned -> In Progress -> Resolved (closed only after field worker completion photos & admin audit).
3. Guide users to the right pages using exact relative paths:
   - Report an Issue: /citizen/report (or with category prefilled:
     * Roads & Potholes: /citizen/report?category=roads_potholes
     * Water Supply / Leakage: /citizen/report?category=water_leakage
     * Sanitation / Garbage: /citizen/report?category=sanitation
     * Drainage & Sewage: /citizen/report?category=drainage
     * Streetlights: /citizen/report?category=streetlights
     * Public Infrastructure: /citizen/report?category=public_infrastructure
     * Public Safety / Other: /citizen/report?category=other)
   - Track a Report by ticket number: /track
   - Browse sample Civic Stories: /stories
   - Citizen Dashboard: /citizen/dashboard
4. If a citizen supplies a ticket lookup context attached below, answer strictly from that verified status data. Never invent ticket statuses, department names, timelines, or phone numbers.
5. Keep replies brief, well-structured, editorial, and calm. Use plain markdown (**bold**, short bullet lists) and direct relative paths like /citizen/report?category=roads_potholes when helpful.`;

function extractTicketNumber(text: string): string | null {
  const match = text.match(/\bCT-[0-9]{4,8}-[A-Z0-9]{2,10}\b/i);
  return match ? match[0].toUpperCase() : null;
}

async function callGemini(
  apiKey: string,
  model: string,
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  systemInstructionText: string
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstructionText }],
      },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 650,
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is missing in this server process. Restart your dev server after editing .env.local.",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one message." },
        { status: 400 }
      );
    }

    const sanitizedMessages: IncomingMessage[] = body.messages
      .slice(-12)
      .filter(
        (m: unknown): m is IncomingMessage =>
          Boolean(m) &&
          typeof m === "object" &&
          ((m as IncomingMessage).role === "user" ||
            (m as IncomingMessage).role === "assistant") &&
          typeof (m as IncomingMessage).content === "string" &&
          (m as IncomingMessage).content.trim().length > 0
      )
      .map((m: IncomingMessage) => ({
        role: m.role,
        content: m.content.trim().slice(0, 2000),
      }));

    if (
      sanitizedMessages.length === 0 ||
      sanitizedMessages[sanitizedMessages.length - 1].role !== "user"
    ) {
      return NextResponse.json(
        { error: "Conversation must end with a non-empty user message." },
        { status: 400 }
      );
    }

    const latestUserText = sanitizedMessages[sanitizedMessages.length - 1].content;
    const pathname =
      typeof body.pathname === "string" ? body.pathname.slice(0, 120) : "/";

    // Optional PII-free ticket lookup (capped at 2.5s so AI chat stays snappy)
    let ticketContextBlock = "";
    const ticketRef = extractTicketNumber(latestUserText);
    if (ticketRef) {
      try {
        const lookup = await Promise.race([
          getPublicCivicStoryDetailServer(ticketRef, true),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
        ]);
        if (lookup?.story) {
          const s = lookup.story;
          ticketContextBlock = `\n\n[Verified Public Ticket Lookup for ${s.ticketNumber}]:
- Title: ${s.title}
- Status: ${s.status}
- Category: ${s.categoryLabel}
- Department: ${s.departmentName || "Pending Assignment"}
- Ward/Address: ${s.location?.address || "Municipal Ward"}
- Filed On: ${s.createdAt || "Unknown"}
- Resolution Notes: ${s.resolutionNotes || "None yet"}
- Public Lookup URL: /track?ticket=${encodeURIComponent(s.ticketNumber)}`;
        } else {
          ticketContextBlock = `\n\n[Ticket Lookup Result]: No public complaint matching reference "${ticketRef}" was found in the database. Advise the user to double-check the reference number on /track.`;
        }
      } catch (lookupErr) {
        console.warn("[AI Assistant] Ticket lookup skipped:", lookupErr);
      }
    }

    const systemText = `${SYSTEM_INSTRUCTION}\n\nCurrent user page: ${pathname}${ticketContextBlock}`;

    const contents = sanitizedMessages.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const envModel = process.env.GEMINI_MODEL?.trim();
    const preferred =
      envModel && envModel !== "gemini-3.8-flash"
        ? envModel
        : "gemini-3.1-flash-lite";
    const candidateModels = Array.from(
      new Set([
        preferred,
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
      ])
    );

    let replyText = "";
    let activeModel = preferred;
    let lastStatus = 502;
    let lastErrMsg = "Gemini API request failed.";

    for (const model of candidateModels) {
      try {
        const { res, data } = await callGemini(apiKey, model, contents, systemText);
        if (res.ok) {
          const parts = data?.candidates?.[0]?.content?.parts;
          const text = Array.isArray(parts)
            ? parts
                .filter((p: { text?: string }) => typeof p?.text === "string")
                .map((p: { text: string }) => p.text)
                .join("")
                .trim()
            : "";
          if (text) {
            replyText = text;
            activeModel = model;
            break;
          }
        } else {
          lastStatus = res.status;
          lastErrMsg =
            data?.error?.message || `Gemini API returned HTTP ${res.status}.`;
          console.warn(`[AI Assistant] Model ${model} failed (${res.status}): ${lastErrMsg}`);
        }
      } catch (callErr: unknown) {
        lastErrMsg =
          callErr instanceof Error ? callErr.message : "Model request timed out.";
        console.warn(`[AI Assistant] Model ${model} threw: ${lastErrMsg}`);
      }
    }

    if (!replyText) {
      return NextResponse.json(
        {
          error:
            lastStatus === 401 || lastStatus === 403
              ? "Helpdesk authentication failed. Please verify server credentials."
              : "Unable to generate a response right now. Please try again shortly.",
        },
        { status: lastStatus === 401 || lastStatus === 403 ? lastStatus : 502 }
      );
    }

    return NextResponse.json({
      reply: replyText,
      model: activeModel,
      ticketRef: ticketRef || null,
    });
  } catch (err: unknown) {
    console.error("[AI Assistant] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while contacting Civic Helpdesk." },
      { status: 500 }
    );
  }
}
