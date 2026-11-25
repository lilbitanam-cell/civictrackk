import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-sm border border-[#DDD9CE] bg-white px-3 py-1 text-sm text-[#252820] shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#77796F] focus-visible:outline-none focus-visible:border-[#1B3A2E] focus-visible:ring-1 focus-visible:ring-[#1B3A2E] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#ECE9DF]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
