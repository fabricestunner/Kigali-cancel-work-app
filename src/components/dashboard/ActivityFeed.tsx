import { Package, Users, Heart, Clock } from "lucide-react";
import type { Order, Donation, Sponsor } from "../../hooks/useDashboardData";

interface ActivityFeedProps {
  orders: Order[];
  donations: Donation[];
  sponsors: Sponsor[];
  loading?: boolean;
}

type ActivityEntry = {
  key: string;
  icon: React.ReactNode;
  description: string;
  time: Date;
  color: string;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ orders, donations, sponsors, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-40 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-32 mb-6" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const entries: ActivityEntry[] = [
    ...orders.slice(0, 6).map((o) => ({
      key: `order-${o.id}`,
      icon: <Package className="w-5 h-5" />,
      description: `Kit order ${o.status.startsWith("paid") ? "paid" : "received"} — ${o.full_name} (×${o.quantity})`,
      time: new Date(o.createdAt),
      color: o.status.startsWith("paid") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700",
    })),
    ...donations.slice(0, 4).map((d) => ({
      key: `don-${d.id}`,
      icon: <Heart className="w-5 h-5" />,
      description: `Donation of ${Number(d.total_amount).toLocaleString()} ${d.currency} — ${d.anonymous ? "Anonymous" : d.full_name}`,
      time: new Date(d.createdAt),
      color: "bg-pink-100 text-pink-700",
    })),
    ...sponsors.slice(0, 3).map((s) => ({
      key: `spon-${s.id}`,
      icon: <Users className="w-5 h-5" />,
      description: `New sponsor: ${s.company_name ?? s.full_name} — ${s.package_label}`,
      time: new Date(s.createdAt),
      color: "bg-purple-100 text-purple-700",
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 8);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-on-surface">
            Recent Activity
          </h3>
          <p className="font-['Inter'] text-sm text-on-surface-variant">
            Latest platform events
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-on-surface-variant py-8 text-sm">No recent activity.</p>
      ) : (
        <div className="space-y-4">
          {entries.map((activity) => (
            <div key={activity.key} className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl ${activity.color} flex items-center justify-center flex-shrink-0`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Inter'] text-sm text-on-surface">{activity.description}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-on-surface-variant" />
                  <span className="font-['Inter'] text-xs text-on-surface-variant">
                    {timeAgo(activity.time)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
