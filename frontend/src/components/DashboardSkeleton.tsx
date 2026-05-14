"use client";

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border/60 rounded ${className}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 fade-in">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <Pulse className="w-9 h-9 rounded-lg" />
              <Pulse className="w-10 h-7 rounded" />
            </div>
            <Pulse className="w-20 h-3 rounded" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-4">
            <Pulse className="w-28 h-3 rounded mb-4" />
            <Pulse className="w-full h-[180px] rounded" />
          </div>
        ))}
      </div>

      {/* Tables skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pulse className="w-4 h-4 rounded" />
                <Pulse className="w-24 h-3 rounded" />
              </div>
              <Pulse className="w-10 h-4 rounded" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Pulse key={j} className="w-full h-8 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
