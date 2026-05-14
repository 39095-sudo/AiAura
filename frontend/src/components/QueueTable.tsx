"use client";

import { Clock, AlertTriangle, CheckCircle, Play, Ban } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}
interface Props {
  title: string;
  icon: React.ReactNode;
  columns: Column[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
  queueKey?: string;
  onStatusChange?: (queue: string, id: number, status: string) => void;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    pending: { cls: "bg-amber-50 text-amber-700", icon: <Clock className="w-3 h-3" /> },
    open: { cls: "bg-red-50 text-red-700", icon: <AlertTriangle className="w-3 h-3" /> },
    in_progress: { cls: "bg-blue-50 text-blue-700", icon: <Play className="w-3 h-3" /> },
    preparing: { cls: "bg-blue-50 text-blue-700", icon: <Play className="w-3 h-3" /> },
    confirmed: { cls: "bg-emerald-50 text-emerald-700", icon: <CheckCircle className="w-3 h-3" /> },
    completed: { cls: "bg-stone-100 text-stone-500", icon: <CheckCircle className="w-3 h-3" /> },
    resolved: { cls: "bg-stone-100 text-stone-500", icon: <CheckCircle className="w-3 h-3" /> },
    cancelled: { cls: "bg-red-50 text-red-400", icon: <Ban className="w-3 h-3" /> },
  };
  const s = map[status] || map.pending;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>{s.icon}{status.replace("_", " ")}</span>;
}

const NEXT_STATUS: Record<string, string[]> = {
  "kitchen-orders": ["preparing", "completed"],
  housekeeping: ["in_progress", "completed"],
  "restaurant-bookings": ["completed", "cancelled"],
  complaints: ["in_progress", "resolved"],
};
const BTN_CLS: Record<string, string> = {
  preparing: "text-blue-700 hover:bg-blue-50", in_progress: "text-blue-700 hover:bg-blue-50",
  completed: "text-emerald-700 hover:bg-emerald-50", resolved: "text-emerald-700 hover:bg-emerald-50",
  cancelled: "text-red-600 hover:bg-red-50",
};

function defaultRender(value: unknown, key: string): React.ReactNode {
  if (key === "status") return <StatusBadge status={String(value)} />;
  if (key === "priority") {
    const u = String(value) === "urgent";
    return <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${u ? "bg-red-50 text-red-700" : "bg-stone-100 text-stone-600"}`}>{u && "! "}{String(value)}</span>;
  }
  if (key === "created_at") return <span className="text-muted text-[11px]">{formatTime(String(value))}</span>;
  if (key === "manager_escalated") return value ? <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">YES</span> : <span className="text-[11px] text-muted">No</span>;
  if (key === "items" && Array.isArray(value)) return <span className="text-[12px]">{(value as { name: string }[]).map(i => i.name).join(", ")}</span>;
  if (key === "total" && typeof value === "number") return <span className="font-semibold text-[13px]">${value.toFixed(2)}</span>;
  if (key === "recommendations" && Array.isArray(value)) return <span className="text-[12px]">{(value as { name: string }[]).map(r => r.name).join(", ")}</span>;
  return <span className="text-[12px]">{String(value ?? "-")}</span>;
}

export default function QueueTable({ title, icon, columns, data, emptyMessage, queueKey, onStatusChange }: Props) {
  const nextStatuses = queueKey ? NEXT_STATUS[queueKey] || [] : [];
  const showActions = queueKey && onStatusChange && nextStatuses.length > 0;

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">{icon}<h3 className="font-semibold text-[13px] text-foreground">{title}</h3></div>
        <div className="flex items-center gap-2">
          <div className="pulse-dot w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Live</span>
          <span className="text-[11px] font-bold text-foreground bg-surface-hover px-2 py-0.5 rounded">{data.length}</span>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="px-4 py-10 text-center text-[13px] text-muted">{emptyMessage || "No records yet"}</div>
      ) : (
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-hover sticky top-0">
              <tr>
                {columns.map(c => <th key={c.key} className="px-3 py-2 text-[10px] font-semibold text-muted uppercase tracking-wider">{c.label}</th>)}
                {showActions && <th className="px-3 py-2 text-[10px] font-semibold text-muted uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.map((row, i) => {
                const status = String(row.status || "");
                const done = ["completed", "resolved", "cancelled"].includes(status);
                return (
                  <tr key={i} className={`hover:bg-surface-hover/50 transition-colors ${done ? "opacity-40" : ""}`}>
                    {columns.map(c => <td key={c.key} className="px-3 py-2.5">{c.render ? c.render(row[c.key], row) : defaultRender(row[c.key], c.key)}</td>)}
                    {showActions && (
                      <td className="px-3 py-2.5">
                        {!done && (
                          <div className="flex gap-1">
                            {nextStatuses.map(ns => (
                              <button key={ns} onClick={() => onStatusChange!(queueKey!, Number(row.id), ns)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border border-border transition-colors ${BTN_CLS[ns] || ""}`}>
                                {ns.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
