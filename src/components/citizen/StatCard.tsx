import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
}

export function StatCard({ icon: Icon, label, value, description }: StatCardProps) {
  return (
    <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-4 flex items-center justify-between hover:border-[#718267] transition-colors">
      <div>
        <p className="text-[11px] font-semibold text-[#77796F] uppercase tracking-[0.14em]">
          {label}
        </p>
        <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#1B3A2E] mt-1 tracking-tight">
          {value}
        </p>
        {description && (
          <p className="text-[11px] text-[#77796F] mt-0.5">{description}</p>
        )}
      </div>
      {Icon && (
        <div className="p-2.5 rounded-sm bg-[#ECE9DF] text-[#1B3A2E] shrink-0">
          <Icon className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
