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
        "flex flex-col items-center justify-center py-12 px-6 text-center rounded-sm border border-dashed border-[#DDD9CE] bg-[#FAF8F2]",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#ECE9DF] text-[#1B3A2E] mb-3">
        {icon || <Inbox className="h-5 w-5" strokeWidth={1.75} />}
      </div>
      <h4 className="font-serif text-base font-semibold text-[#252820]">{title}</h4>
      <p className="mt-1 text-xs text-[#77796F] max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
