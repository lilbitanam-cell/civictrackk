import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";

interface NotificationItemProps {
  title: string;
  message: string;
  timestamp: any;
}

export function NotificationItem({ title, message, timestamp }: NotificationItemProps) {
  let timeAgo = "recently";
  try {
    const d = timestamp?.toDate
      ? timestamp.toDate()
      : timestamp?.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    if (!Number.isNaN(d.getTime())) {
      timeAgo = formatDistanceToNow(d, { addSuffix: true });
    }
  } catch {
    timeAgo = "recently";
  }

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-sm bg-[#FAF8F2] border border-[#DDD9CE] hover:bg-[#ECE9DF]/50 transition-colors">
      <div className="mt-0.5 p-1.5 rounded-sm bg-[#ECE9DF] text-[#1B3A2E] shrink-0">
        <Bell className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-[#252820] truncate">{title}</h4>
          <span className="text-[11px] text-[#77796F] shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs text-[#77796F] mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
