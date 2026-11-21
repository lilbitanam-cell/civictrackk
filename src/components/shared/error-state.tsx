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
        "rounded-md border border-[#E5E8DF] bg-white p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-[#F8F2F2] text-[#9B3B3B]">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-[#30352D]">{title}</h4>
          <p className="text-xs text-[#74796F]">{message}</p>
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
