import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center rounded-md border border-dashed border-[#E5E8DF] bg-white",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F1F3EC] text-[#536247] mb-3">
        {icon || <Inbox className="h-5 w-5" />}
      </div>
      <h4 className="text-sm font-semibold text-[#30352D]">{title}</h4>
      <p className="mt-1 text-xs text-[#74796F] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
