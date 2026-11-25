import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A2E] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#1B3A2E] text-[#F7F5EE] hover:bg-[#263D30] active:bg-[#152D24]",
        secondary:
          "bg-[#ECE9DF] text-[#1B3A2E] hover:bg-[#E2DEC9] border border-[#DDD9CE]",
        outline:
          "bg-[#FAF8F2] text-[#252820] border border-[#DDD9CE] hover:bg-[#ECE9DF] hover:text-[#1B3A2E]",
        ghost:
          "text-[#252820] hover:bg-[#ECE9DF] hover:text-[#1B3A2E]",
        destructive:
          "bg-[#8B342E] text-[#F7F5EE] hover:bg-[#702823]",
        link: "text-[#1B3A2E] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-11 rounded-sm px-6 text-sm",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
