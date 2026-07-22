import type { LucideIcon } from "lucide-react";
import { Sparkline } from "./Sparkline";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down";
  data?: number[];
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  data,
  loading,
}: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100" />
          <div className="w-16 h-6 bg-gray-100 rounded-full" />
        </div>
        <div className="h-7 bg-gray-100 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
        <div className="h-10 bg-gray-50 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            trend === "up"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {trend === "up" ? "↑" : "↓"} {change}
        </div>
      </div>
      <div className="mb-2">
        <div className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface">
          {value}
        </div>
        <div className="font-['Inter'] text-sm text-on-surface-variant">{title}</div>
      </div>
      {data && data.length > 0 && <Sparkline data={data as number[]} trend={trend} />}
    </div>
  );
}
