"use client";

import { useState } from "react";
import { NotificationDocument } from "@/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

function formatNotifTime(createdAt: unknown): string {
  if (!createdAt) return "—";
  try {
    const raw = createdAt as any;
    const d =
      typeof raw === "string"
        ? new Date(raw)
        : typeof raw?.toDate === "function"
        ? raw.toDate()
        : typeof raw?.seconds === "number"
        ? new Date(raw.seconds * 1000)
        : typeof raw?._seconds === "number"
        ? new Date(raw._seconds * 1000)
        : new Date(raw);
    if (Number.isNaN(d.getTime())) return "—";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

export default function NotificationsClient({
  notifications: initial,
}: {
  notifications: NotificationDocument[];
}) {
  const [notifs, setNotifs] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const markRead = async (id: string) => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update notification.");
      }
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark notification as read.");
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to mark notifications as read.");
      }
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark all as read.");
    } finally {
      setBusy(false);
    }
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-xs px-3 py-2 rounded border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAllRead}
            disabled={busy}
            className="text-xs font-medium text-[#1B3A2E] hover:underline disabled:opacity-50"
          >
            Mark all as read ({unreadCount})
          </button>
        </div>
      )}

      {notifs.map((n) => (
        <div
          key={n.id}
          className={`flex gap-4 items-start p-4 rounded-sm border transition-colors ${
            n.isRead
              ? "bg-[#FAF8F2] border-[#DDD9CE]"
              : "bg-[#ECE9DF]/70 border-[#718267]"
          }`}
        >
          <div className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-[#1B3A2E]"}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#252820]">{n.title}</p>
            <p className="text-xs text-[#77796F] mt-0.5 leading-relaxed">{n.message}</p>
            {n.actionUrl && (
              <Link
                href={n.actionUrl}
                className="text-xs font-medium text-[#1B3A2E] hover:underline mt-1.5 inline-block"
              >
                View details →
              </Link>
            )}
            <p className="text-xs text-[#77796F] mt-1">
              {formatNotifTime(n.createdAt)}
            </p>
          </div>
          {!n.isRead && (
            <button
              onClick={() => markRead(n.id)}
              disabled={busy}
              className="text-xs font-medium text-[#77796F] hover:text-[#1B3A2E] shrink-0 disabled:opacity-50"
            >
              Mark read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
