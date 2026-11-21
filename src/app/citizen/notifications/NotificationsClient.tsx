"use client";

import { useState } from "react";
import { NotificationDocument } from "@/types";
import { markNotificationAsRead } from "@/services/notifications.service";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function NotificationsClient({
  notifications: initial,
}: {
  notifications: NotificationDocument[];
}) {
  const [notifs, setNotifs] = useState(initial);

  const markRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllRead = async () => {
    await Promise.all(notifs.filter((n) => !n.isRead).map((n) => markNotificationAsRead(n.id)));
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAllRead}
            className="text-xs text-[#788568] hover:underline"
          >
            Mark all as read ({unreadCount})
          </button>
        </div>
      )}

      {notifs.map((n) => (
        <div
          key={n.id}
          className={`flex gap-4 items-start p-4 rounded-md border transition-colors ${
            n.isRead
              ? "bg-white border-[#E5E8DF]"
              : "bg-[#F1F3EC] border-[#B4BBA5]"
          }`}
        >
          <div className={`mt-1 w-2 h-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-[#788568]"}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#30352D]">{n.title}</p>
            <p className="text-xs text-[#74796F] mt-0.5">{n.message}</p>
            {n.actionUrl && (
              <Link
                href={n.actionUrl}
                className="text-xs text-[#788568] hover:underline mt-1 inline-block"
              >
                View details →
              </Link>
            )}
            <p className="text-xs text-[#B4BBA5] mt-1">
              {(() => {
                if (!n.createdAt) return "—";
                try {
                  const d = typeof (n.createdAt as any).toDate === "function" ? (n.createdAt as any).toDate() : (n.createdAt as any).seconds ? new Date((n.createdAt as any).seconds * 1000) : new Date(n.createdAt as string);
                  return formatDistanceToNow(d, { addSuffix: true });
                } catch {
                  return "—";
                }
              })()}
            </p>
          </div>
          {!n.isRead && (
            <button
              onClick={() => markRead(n.id)}
              className="text-xs text-[#74796F] hover:text-[#30352D] shrink-0"
            >
              Mark read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
