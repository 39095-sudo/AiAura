"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DashboardStats from "@/components/DashboardStats";
import DashboardCharts from "@/components/DashboardCharts";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import QueueTable from "@/components/QueueTable";
import {
  getDashboardStats,
  getKitchenOrders,
  getHousekeeping,
  getRestaurantBookings,
  getComplaints,
  getRecommendations,
  updateItemStatus,
} from "@/lib/api";
import {
  DashboardStats as StatsType,
  KitchenOrder,
  HousekeepingRequest,
  RestaurantBooking,
  Complaint,
  Recommendation,
} from "@/lib/types";
import {
  ChefHat,
  BedDouble,
  Clock,
  MessageCircleWarning,
  Compass,
  RefreshCw,
} from "lucide-react";

const emptyStats: StatsType = {
  kitchen_orders: 0, housekeeping: 0, restaurant_bookings: 0,
  complaints: 0, recommendations: 0, pending_kitchen: 0,
  pending_housekeeping: 0, open_complaints: 0, escalated_complaints: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsType>(emptyStats);
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
  const [housekeeping, setHousekeeping] = useState<HousekeepingRequest[]>([]);
  const [bookings, setBookings] = useState<RestaurantBooking[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [s, k, h, b, c, r] = await Promise.all([
        getDashboardStats(),
        getKitchenOrders(),
        getHousekeeping(),
        getRestaurantBookings(),
        getComplaints(),
        getRecommendations(),
      ]);
      setStats(s);
      setKitchenOrders(k);
      setHousekeeping(h);
      setBookings(b);
      setComplaints(c);
      setRecommendations(r);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsRefreshing(false);
      setInitialLoad(false);
    }
  }, []);

  const handleStatusChange = async (queue: string, id: number, status: string) => {
    try {
      await updateItemStatus(queue, id, status);
      fetchAll();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Staff Dashboard</h1>
              <p className="text-[13px] text-muted mt-0.5">Real-time guest service overview</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <div className="pulse-dot w-1.5 h-1.5 rounded-full bg-success" />
                Live · {lastUpdated.toLocaleTimeString()}
              </div>
              <button onClick={fetchAll} disabled={isRefreshing}
                className="p-1.5 rounded-md hover:bg-surface-hover transition-colors text-muted hover:text-foreground border border-border">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {initialLoad ? <DashboardSkeleton /> : <>
          <DashboardStats stats={stats} />

          <DashboardCharts stats={stats} kitchenOrders={kitchenOrders} housekeeping={housekeeping} complaints={complaints} />

          {/* Queue Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QueueTable
              title="Kitchen Orders"
              icon={<ChefHat className="w-4 h-4 text-amber-700" />}
                            emptyMessage="No kitchen orders yet"
              columns={[
                { key: "room_number", label: "Room" },
                { key: "items", label: "Items" },
                { key: "total", label: "Total" },
                { key: "status", label: "Status" },
                { key: "created_at", label: "Time" },
              ]}
              data={kitchenOrders as unknown as Record<string, unknown>[]}
              queueKey="kitchen-orders"
              onStatusChange={handleStatusChange}
            />

            <QueueTable
              title="Housekeeping Queue"
              icon={<BedDouble className="w-4 h-4 text-sky-700" />}
                            emptyMessage="No housekeeping requests"
              columns={[
                { key: "room_number", label: "Room" },
                { key: "request", label: "Request" },
                { key: "priority", label: "Priority" },
                { key: "status", label: "Status" },
                { key: "created_at", label: "Time" },
              ]}
              data={housekeeping as unknown as Record<string, unknown>[]}
              queueKey="housekeeping"
              onStatusChange={handleStatusChange}
            />

            <QueueTable
              title="Restaurant Bookings"
              icon={<Clock className="w-4 h-4 text-emerald-700" />}
                            emptyMessage="No restaurant bookings"
              columns={[
                { key: "guest_name", label: "Guest" },
                { key: "room_number", label: "Room" },
                { key: "date", label: "Date" },
                { key: "time_slot", label: "Time" },
                { key: "party_size", label: "Party" },
                { key: "status", label: "Status" },
              ]}
              data={bookings as unknown as Record<string, unknown>[]}
              queueKey="restaurant-bookings"
              onStatusChange={handleStatusChange}
            />

            <QueueTable
              title="Complaints"
              icon={<MessageCircleWarning className="w-4 h-4 text-red-700" />}
                            emptyMessage="No complaints - great news!"
              columns={[
                { key: "room_number", label: "Room" },
                { key: "complaint", label: "Complaint" },
                { key: "manager_escalated", label: "Escalated" },
                { key: "status", label: "Status" },
                { key: "created_at", label: "Time" },
              ]}
              data={complaints as unknown as Record<string, unknown>[]}
              queueKey="complaints"
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Full width recommendations */}
          <QueueTable
            title="Recommendations Log"
            icon={<Compass className="w-4 h-4 text-primary" />}
                        emptyMessage="No recommendations requested"
            columns={[
              { key: "room_number", label: "Room" },
              { key: "query", label: "Query" },
              { key: "recommendations", label: "Recommended" },
              { key: "created_at", label: "Time" },
            ]}
            data={recommendations as unknown as Record<string, unknown>[]}
          />
          </>}
        </div>
      </main>
    </>
  );
}
