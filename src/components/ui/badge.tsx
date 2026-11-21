import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#788568] text-white",
        secondary:
          "border-[#E5E8DF] bg-[#E9EDE4] text-[#3E4B37]",
        pale:
          "border-[#E5E8DF] bg-[#F1F3EC] text-[#536247]",
        outline:
          "border-[#E5E8DF] bg-white text-[#30352D]",
        success:
          "border-transparent bg-[#3E4B37] text-white",
        warning:
          "border-[#E5E8DF] bg-[#F4F1DE] text-[#6E552F]",
        destructive:
          "border-transparent bg-[#9B3B3B] text-white",
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
