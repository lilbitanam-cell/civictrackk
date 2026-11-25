import { NextRequest, NextResponse } from "next/server";
import { getPublicCivicStoryDetailServer } from "@/services/server/complaints.server";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

/**
 * GET /api/complaints/track?ticket=CT-YYYYMM-XXXX
 * Public, PII-free complaint status & timeline lookup by ticket number.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Tracking service is temporarily unavailable." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ticket = (searchParams.get("ticket") || "").trim();

    if (!ticket || ticket.length < 4) {
      return NextResponse.json(
        { error: "Please enter a valid ticket reference number (e.g. CT-202611-1234)." },
        { status: 400 }
      );
    }

    const result = await getPublicCivicStoryDetailServer(ticket, true);
    if (!result) {
      return NextResponse.json(
        { error: `No civic report found matching reference "${ticket.toUpperCase()}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: result.story,
      timeline: result.timeline,
    });
  } catch (err: unknown) {
    console.error("GET /api/complaints/track error:", err);
    return NextResponse.json(
      { error: "Unable to look up complaint status right now." },
      { status: 500 }
    );
  }
}
