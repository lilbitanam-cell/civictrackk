import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Clock, Tag } from 'lucide-react';

interface ComplaintCardProps {
  complaint: any;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[#E9EDE4] text-[#30352D]",
  submitted: "bg-[#E9EDE4] text-[#30352D]",
  under_review: "bg-amber-50 text-amber-800 border border-amber-200",
  assigned: "bg-[#B4BBA5] text-[#30352D]",
  "in-progress": "bg-[#788568] text-white",
  in_progress: "bg-[#788568] text-white",
  resolution_submitted: "bg-blue-50 text-blue-800 border border-blue-200",
  resolved: "bg-[#3E4B37] text-white",
  closed: "bg-[#30352D] text-white",
  rejected: "border border-red-200 text-red-700 bg-red-50",
};

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  let timeAgo = "recently";
  try {
    const d = complaint.createdAt?.toDate
      ? complaint.createdAt.toDate()
      : complaint.createdAt?.seconds
      ? new Date(complaint.createdAt.seconds * 1000)
      : new Date(complaint.createdAt);
    timeAgo = formatDistanceToNow(d, { addSuffix: true });
  } catch {
    timeAgo = "recently";
  }

  const statusKey = complaint.status || "submitted";
  const statusClass = STATUS_COLORS[statusKey] || "bg-[#E9EDE4] text-[#30352D]";

  return (
    <Link href={`/citizen/complaints/${complaint.id}`} className="block group">
      <div className="bg-white border border-[#E5E8DF] rounded-md p-4 hover:border-[#788568] transition-colors flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-mono font-medium text-[#74796F]">
              {complaint.ticketNumber || `#${complaint.id.slice(0, 8)}`}
            </span>
            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>
              {statusKey.replace(/[-_]/g, ' ')}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-[#30352D] group-hover:text-[#536247] transition-colors line-clamp-1">
            {complaint.title}
          </h3>

          {complaint.description && (
            <p className="text-xs text-[#74796F] line-clamp-2 mt-1 leading-relaxed">
              {complaint.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#F1F3EC] flex items-center justify-between text-xs text-[#74796F]">
          <span className="flex items-center gap-1 truncate capitalize">
            <Tag className="h-3 w-3 shrink-0 text-[#788568]" />
            <span className="truncate">{complaint.category?.replace(/_/g, ' ') || 'Civic Issue'}</span>
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
