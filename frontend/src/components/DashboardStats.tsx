"use client";

import { ChefHat, BedDouble, Clock, MessageCircleWarning, Compass } from "lucide-react";
import { DashboardStats as Stats } from "@/lib/types";

interface Props { stats: Stats; }

export default function DashboardStats({ stats }: Props) {
  const cards = [
    { label: "Kitchen Orders", value: stats.kitchen_orders, sub: stats.pending_kitchen, subLabel: "pending", icon: ChefHat, gradient: "from-amber-700 to-amber-500" },
    { label: "Housekeeping", value: stats.housekeeping, sub: stats.pending_housekeeping, subLabel: "pending", icon: BedDouble, gradient: "from-sky-700 to-sky-500" },
    { label: "Reservations", value: stats.restaurant_bookings, sub: 0, subLabel: "", icon: Clock, gradient: "from-emerald-700 to-emerald-500" },
    { label: "Complaints", value: stats.complaints, sub: stats.escalated_complaints, subLabel: "escalated", icon: MessageCircleWarning, gradient: "from-red-700 to-red-500" },
    { label: "Recommendations", value: stats.recommendations, sub: 0, subLabel: "", icon: Compass, gradient: "from-primary to-primary-light" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-lg border border-border p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-sm`}>
              <c.icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">{c.value}</span>
          </div>
          <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{c.label}</p>
          {c.sub > 0 && (
            <span className="inline-block mt-1.5 text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
              {c.sub} {c.subLabel}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
