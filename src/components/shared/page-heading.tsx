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
        "flex flex-col gap-2 pb-5 border-b border-[#DDD9CE] md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-serif text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-[#252820]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-[#77796F] max-w-2xl leading-relaxed">{description}</p>
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
