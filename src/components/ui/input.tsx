import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-[#E5E8DF] bg-white px-3 py-1 text-sm text-[#30352D] shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#74796F] focus-visible:outline-none focus-visible:border-[#788568] focus-visible:ring-1 focus-visible:ring-[#788568] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F1F3EC]",
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
