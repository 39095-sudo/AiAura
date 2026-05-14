"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DashboardStats } from "@/lib/types";
import { KitchenOrder, HousekeepingRequest, Complaint } from "@/lib/types";

interface Props {
  stats: DashboardStats;
  kitchenOrders: KitchenOrder[];
  housekeeping: HousekeepingRequest[];
  complaints: Complaint[];
}

const COLORS = ["#c9a84c", "#1e3a5f", "#2d8a5e", "#c0392b", "#7a7267"];

export default function DashboardCharts({ stats, kitchenOrders, housekeeping, complaints }: Props) {
  // Pie: request distribution
  const pieData = [
    { name: "Kitchen", value: stats.kitchen_orders },
    { name: "Housekeeping", value: stats.housekeeping },
    { name: "Reservations", value: stats.restaurant_bookings },
    { name: "Complaints", value: stats.complaints },
    { name: "Recommendations", value: stats.recommendations },
  ].filter((d) => d.value > 0);

  // Bar: status breakdown
  const statusData = [
    {
      name: "Kitchen",
      pending: kitchenOrders.filter((o) => o.status === "pending").length,
      active: kitchenOrders.filter((o) => o.status === "preparing").length,
      done: kitchenOrders.filter((o) => o.status === "completed").length,
    },
    {
      name: "Housekeeping",
      pending: housekeeping.filter((h) => h.status === "pending").length,
      active: housekeeping.filter((h) => h.status === "in_progress").length,
      done: housekeeping.filter((h) => h.status === "completed").length,
    },
    {
      name: "Complaints",
      pending: complaints.filter((c) => c.status === "open").length,
      active: complaints.filter((c) => c.status === "in_progress").length,
      done: complaints.filter((c) => c.status === "resolved").length,
    },
  ];

  // Priority split
  const urgentCount = housekeeping.filter((h) => h.priority === "urgent").length;
  const normalCount = housekeeping.filter((h) => h.priority === "normal").length;
  const priorityData = [
    { name: "Urgent", value: urgentCount },
    { name: "Normal", value: normalCount },
  ].filter((d) => d.value > 0);

  const escalated = complaints.filter((c) => c.manager_escalated).length;
  const notEscalated = complaints.length - escalated;
  const escalationData = [
    { name: "Escalated", value: escalated },
    { name: "Standard", value: notEscalated },
  ].filter((d) => d.value > 0);

  const hasData = pieData.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg border border-border p-8 text-center">
        <p className="text-[13px] text-muted">Charts will appear once guest requests come in</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Request Distribution Pie */}
      <div className="bg-white rounded-lg border border-border p-4">
        <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-3">Request Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={2} stroke="#faf9f7">
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e4de" }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Breakdown Bar */}
      <div className="bg-white rounded-lg border border-border p-4">
        <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-3">Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={statusData} barSize={16}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e4de" }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="pending" fill="#c9a84c" radius={[2, 2, 0, 0]} name="Pending" />
            <Bar dataKey="active" fill="#1e3a5f" radius={[2, 2, 0, 0]} name="Active" />
            <Bar dataKey="done" fill="#2d8a5e" radius={[2, 2, 0, 0]} name="Done" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Priority & Escalation */}
      <div className="bg-white rounded-lg border border-border p-4 flex flex-col gap-4">
        {priorityData.length > 0 && (
          <div>
            <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2">Housekeeping Priority</h3>
            <ResponsiveContainer width="100%" height={85}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={35} dataKey="value" strokeWidth={2} stroke="#faf9f7">
                  <Cell fill="#c0392b" />
                  <Cell fill="#2d8a5e" />
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e8e4de" }} />
                <Legend iconSize={6} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {escalationData.length > 0 && (
          <div>
            <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2">Complaint Escalations</h3>
            <ResponsiveContainer width="100%" height={85}>
              <PieChart>
                <Pie data={escalationData} cx="50%" cy="50%" outerRadius={35} dataKey="value" strokeWidth={2} stroke="#faf9f7">
                  <Cell fill="#c0392b" />
                  <Cell fill="#7a7267" />
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e8e4de" }} />
                <Legend iconSize={6} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {priorityData.length === 0 && escalationData.length === 0 && (
          <p className="text-[12px] text-muted text-center py-6">No priority or escalation data yet</p>
        )}
      </div>
    </div>
  );
}
