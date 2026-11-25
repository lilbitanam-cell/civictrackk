import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Unable to complete request",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-sm border border-[#DDD9CE] bg-[#FAF8F2] p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-[#F4E8E7] text-[#8B342E]">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-serif text-sm font-semibold text-[#252820]">{title}</h4>
          <p className="text-xs text-[#77796F]">{message}</p>
          {onRetry && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
