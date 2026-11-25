import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors focus:outline-none select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#1B3A2E] text-[#F7F5EE]",
        secondary:
          "border-[#DDD9CE] bg-[#ECE9DF] text-[#263D30]",
        pale:
          "border-[#DDD9CE] bg-[#FAF8F2] text-[#718267]",
        outline:
          "border-[#DDD9CE] bg-[#FAF8F2] text-[#252820]",
        success:
          "border-transparent bg-[#2D5A3F] text-[#F7F5EE]",
        warning:
          "border-[#DDD9CE] bg-[#F3EEDB] text-[#6E552F]",
        destructive:
          "border-transparent bg-[#8B342E] text-[#F7F5EE]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
