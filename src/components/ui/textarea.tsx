import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[#E5E8DF] bg-white px-3 py-2 text-sm text-[#30352D] placeholder:text-[#74796F] focus-visible:outline-none focus-visible:border-[#788568] focus-visible:ring-1 focus-visible:ring-[#788568] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F1F3EC]",
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
