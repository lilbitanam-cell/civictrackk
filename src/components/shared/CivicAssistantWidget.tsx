"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Loader2,
  ArrowUpRight,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Help me draft a pothole complaint for Ward 14",
  "Which category should I pick for a leaking water main?",
  "How do I track a report without logging in?",
];

/** Renders inline **bold**, [label](/route), and bare /route links cleanly. */
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split("\n");

  const renderInline = (line: string, lineKey: number) => {
    const tokenRegex =
      /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/(?:citizen|track|stories|login|register)(?:\/[a-zA-Z0-9_-]+)*(?:\?[a-zA-Z0-9_=&%-]+)?\)|\/(?:citizen|track|stories|login|register)(?:\/[a-zA-Z0-9_-]+)*(?:\?[a-zA-Z0-9_=&%-]+)?)/g;
    const parts = line.split(tokenRegex);

    return parts.map((part, idx) => {
      if (!part) return null;
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={`${lineKey}-${idx}`} className="font-semibold text-[#1B3A2E]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("[") && part.includes("](/")) {
        const match = part.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/);
        if (match) {
          return (
            <Link
              key={`${lineKey}-${idx}`}
              href={match[2]}
              className="inline-flex items-center gap-0.5 font-medium text-[#1B3A2E] underline underline-offset-2 hover:text-[#263D30]"
            >
              <span>{match[1]}</span>
              <ArrowUpRight className="h-3 w-3 inline" />
            </Link>
          );
        }
      }
      if (part.startsWith("/")) {
        return (
          <Link
            key={`${lineKey}-${idx}`}
            href={part}
            className="inline-flex items-center gap-0.5 font-medium text-[#1B3A2E] underline underline-offset-2 hover:text-[#263D30]"
          >
            <span>{part}</span>
            <ArrowUpRight className="h-3 w-3 inline" />
          </Link>
        );
      }
      return <React.Fragment key={`${lineKey}-${idx}`}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-[#252820]">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        if (isBullet) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-[#718267] shrink-0" />
              <span>{renderInline(trimmed.slice(2), i)}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line, i)}</p>;
      })}
    </div>
  );
}

export function CivicAssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const listEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const msgSeqRef = React.useRef(0);

  React.useEffect(() => {
    if (open) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, busy]);

  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;

    const userMsg: ChatMessage = {
      id: `u-${++msgSeqRef.current}`,
      role: "user",
      content: text,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setInput("");
    setError(null);
    setBusy(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname,
          messages: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status}).`);
      }

      const reply: ChatMessage = {
        id: `a-${++msgSeqRef.current}`,
        role: "assistant",
        content: String(data.reply || ""),
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the Civic Helpdesk. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1800);
    } catch {
      // Clipboard write unavailable
    }
  };

  const handleReset = () => {
    setMessages([]);
    setError(null);
    setInput("");
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end">
      {/* Assistant Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="CivicTrack Public Helpdesk"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-[390px] max-h-[75vh] h-[520px] flex flex-col border border-[#DDD9CE] bg-[#FAF8F2] rounded-sm shadow-lg overflow-hidden"
        >
          {/* Editorial Header */}
          <div className="bg-[#1B3A2E] text-[#F7F5EE] px-4 py-3.5 flex items-center justify-between gap-2 border-b border-[#263D30]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#B8C4AE] font-medium">
                Municipal Public Desk
              </p>
              <h2 className="font-serif text-base font-semibold leading-tight mt-0.5">
                Civic Helpdesk
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  title="Start a new conversation"
                  aria-label="Start a new conversation"
                  className="rounded-sm p-1.5 text-[#D5DDD0] hover:bg-[#263D30] hover:text-[#F7F5EE] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close assistant"
                aria-label="Close assistant"
                className="rounded-sm p-1.5 text-[#D5DDD0] hover:bg-[#263D30] hover:text-[#F7F5EE] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F5EE]">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="border border-[#DDD9CE] bg-[#FAF8F2] p-3.5 rounded-sm space-y-1.5">
                  <p className="font-serif text-sm font-semibold text-[#1B3A2E]">
                    How can I help with your civic filing?
                  </p>
                  <p className="text-xs text-[#77796F] leading-relaxed">
                    Ask me to draft a complaint description, pick the right
                    municipal category, explain CivicTrack stages, or look up a{" "}
                    <span className="font-mono text-[#1B3A2E]">CT-…</span> ticket
                    reference.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#77796F]">
                    Suggested Questions
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className="text-left text-xs text-[#252820] border border-[#DDD9CE] bg-[#FAF8F2] hover:bg-[#ECE9DF] hover:border-[#718267] px-3 py-2 rounded-sm transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-sm px-3.5 py-2.5 border",
                      msg.role === "user"
                        ? "bg-[#1B3A2E] text-[#F7F5EE] border-[#1B3A2E] text-xs leading-relaxed"
                        : "bg-[#FAF8F2] border-[#DDD9CE] text-[#252820]"
                    )}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-2">
                        <FormattedMessage text={msg.content} />
                        <div className="pt-1 border-t border-[#DDD9CE]/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 text-[10px] text-[#77796F] hover:text-[#1B3A2E] cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="h-3 w-3 text-[#2D5A3F]" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {busy && (
              <div className="flex items-start">
                <div className="border border-[#DDD9CE] bg-[#FAF8F2] px-3.5 py-2.5 rounded-sm flex items-center gap-2 text-xs text-[#77796F]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1B3A2E]" />
                  <span>Drafting response…</span>
                </div>
              </div>
            )}

            {error && (
              <div className="border border-[#E5C9C6] bg-[#FAF0EE] text-[#8B342E] px-3 py-2 rounded-sm text-xs flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div ref={listEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="border-t border-[#DDD9CE] bg-[#FAF8F2] p-3 flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about reporting, categories, or a CT- ticket…"
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none rounded-sm border border-[#DDD9CE] bg-[#F7F5EE] px-3 py-2 text-xs text-[#252820] placeholder:text-[#77796F] focus:outline-none focus:ring-1 focus:ring-[#1B3A2E] max-h-24"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="h-8.5 w-8.5 shrink-0 inline-flex items-center justify-center rounded-sm bg-[#1B3A2E] text-[#F7F5EE] hover:bg-[#263D30] disabled:opacity-45 transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close Civic Helpdesk" : "Open Civic Helpdesk"}
        className="inline-flex items-center gap-2 rounded-sm border border-[#1B3A2E] bg-[#1B3A2E] px-4 py-2.5 text-xs font-medium text-[#F7F5EE] shadow-md hover:bg-[#263D30] transition-colors cursor-pointer"
      >
        {open ? (
          <>
            <X className="h-4 w-4" />
            <span>Close Helpdesk</span>
          </>
        ) : (
          <>
            <MessageSquare className="h-4 w-4" />
            <span>Civic Helpdesk</span>
          </>
        )}
      </button>
    </div>
  );
}
