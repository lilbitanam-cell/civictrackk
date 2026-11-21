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
        "flex flex-col items-center justify-center py-12 px-4 text-center rounded-md border border-dashed border-[#E5E8DF] bg-white",
        className
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin text-[#788568]" />
      <p className="mt-2.5 text-xs font-medium text-[#74796F]">{message}</p>
    </div>
  );
}
