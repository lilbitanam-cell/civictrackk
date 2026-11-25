import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading records...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center rounded-sm border border-dashed border-[#DDD9CE] bg-[#FAF8F2]",
        className
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin text-[#1B3A2E]" />
      <p className="mt-2.5 text-xs font-medium text-[#77796F]">{message}</p>
    </div>
  );
}
