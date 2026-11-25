import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Clock, Tag } from "lucide-react";

interface ComplaintCardProps {
  complaint: any;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[#ECE9DF] text-[#252820] border-[#DDD9CE]",
  submitted: "bg-[#ECE9DF] text-[#252820] border-[#DDD9CE]",
  under_review: "bg-[#F3EEDB] text-[#6E552F] border-[#DDD9CE]",
  assigned: "bg-[#ECE9DF] text-[#1B3A2E] border-[#DDD9CE]",
  "in-progress": "bg-[#718267] text-[#F7F5EE] border-transparent",
  in_progress: "bg-[#718267] text-[#F7F5EE] border-transparent",
  resolution_submitted: "bg-[#ECE9DF] text-[#1B3A2E] border-[#718267]",
  resolved: "bg-[#2D5A3F] text-[#F7F5EE] border-transparent",
  closed: "bg-[#1B3A2E] text-[#F7F5EE] border-transparent",
  rejected: "border-[#E4C9C6] text-[#8B342E] bg-[#F4E8E7]",
};

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  let timeAgo = "recently";
  try {
    const d = complaint.createdAt?.toDate
      ? complaint.createdAt.toDate()
      : complaint.createdAt?.seconds
      ? new Date(complaint.createdAt.seconds * 1000)
      : new Date(complaint.createdAt);
    if (!Number.isNaN(d.getTime())) {
      timeAgo = formatDistanceToNow(d, { addSuffix: true });
    }
  } catch {
    timeAgo = "recently";
  }

  const statusKey = complaint.status || "submitted";
  const statusClass =
    STATUS_COLORS[statusKey] || "bg-[#ECE9DF] text-[#252820] border-[#DDD9CE]";

  return (
    <Link href={`/citizen/complaints/${complaint.id}`} className="block group">
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-4 hover:border-[#718267] transition-colors flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-mono font-medium text-[#77796F]">
              {complaint.ticketNumber || `#${complaint.id.slice(0, 8)}`}
            </span>
            <span
              className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm border ${statusClass}`}
            >
              {statusKey.replace(/[-_]/g, " ")}
            </span>
          </div>

          <h3 className="font-serif text-base font-semibold text-[#252820] group-hover:text-[#1B3A2E] transition-colors line-clamp-1">
            {complaint.title}
          </h3>

          {complaint.description && (
            <p className="text-xs text-[#77796F] line-clamp-2 mt-1 leading-relaxed">
              {complaint.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#DDD9CE] flex items-center justify-between text-xs text-[#77796F]">
          <span className="flex items-center gap-1 truncate capitalize">
            <Tag className="h-3 w-3 shrink-0 text-[#718267]" />
            <span className="truncate">
              {complaint.category?.replace(/_/g, " ") || "Civic Issue"}
            </span>
          </span>
          <span className="flex items-center gap-1 shrink-0 text-[11px]">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
