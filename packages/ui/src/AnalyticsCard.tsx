import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./Card";

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  growth?: number | string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function AnalyticsCard({
  title,
  value,
  growth,
  isPositive = true,
  icon,
  subtitle,
  className = "",
}: AnalyticsCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300">
            {icon}
          </div>
        )}
      </div>

      <div className="my-2 text-2xl font-bold text-slate-100">{value}</div>

      {(growth !== undefined || subtitle) && (
        <div className="flex items-center gap-2 text-xs">
          {growth !== undefined && (
            <span
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-bold ${
                isPositive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {typeof growth === "number" ? `${growth > 0 ? "+" : ""}${growth}%` : growth}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
