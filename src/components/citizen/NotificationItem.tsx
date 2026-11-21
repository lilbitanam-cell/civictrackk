import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';

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
    timeAgo = formatDistanceToNow(d, { addSuffix: true });
  } catch {
    timeAgo = "recently";
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-white border border-[#E5E8DF] hover:bg-[#F8F9F5] transition-colors">
      <div className="mt-0.5 p-1.5 rounded-full bg-[#E9EDE4] text-[#536247] shrink-0">
        <Bell className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-[#30352D] truncate">{title}</h4>
          <span className="text-[11px] text-[#74796F] shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs text-[#74796F] mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
