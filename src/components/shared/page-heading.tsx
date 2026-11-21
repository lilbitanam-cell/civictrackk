import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeadingProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeading({
  title,
  description,
  badge,
  actions,
  className,
}: PageHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 pb-5 border-b border-[#E5E8DF] md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-[#30352D]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-[#74796F] max-w-2xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
