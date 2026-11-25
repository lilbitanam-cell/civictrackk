import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-sm border border-[#DDD9CE] bg-white px-3 py-2 text-sm text-[#252820] placeholder:text-[#77796F] focus-visible:outline-none focus-visible:border-[#1B3A2E] focus-visible:ring-1 focus-visible:ring-[#1B3A2E] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#ECE9DF]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
