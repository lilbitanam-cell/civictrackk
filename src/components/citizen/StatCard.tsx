import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
}

export function StatCard({ icon: Icon, label, value, description }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E5E8DF] rounded-md p-4 flex items-center justify-between shadow-none hover:border-[#B4BBA5] transition-colors">
      <div>
        <p className="text-xs font-medium text-[#74796F] uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[#30352D] mt-1 tracking-tight">{value}</p>
        {description && (
          <p className="text-[11px] text-[#74796F] mt-0.5">{description}</p>
        )}
      </div>
      {Icon && (
        <div className="p-2.5 rounded-md bg-[#F1F3EC] text-[#536247] shrink-0">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
