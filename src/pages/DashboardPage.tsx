import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import { KPICard } from "../components/dashboard/KPICard";
import { KitInventoryTable } from "../components/dashboard/KitInventoryTable";
import { RecentOrdersTable } from "../components/dashboard/RecentOrdersTable";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { useDashboardData } from "../hooks/useDashboardData";
import type { Volunteer, Influencer } from "../hooks/useDashboardData";
import { Shirt, Heart, Users, DollarSign, RefreshCw, AlertTriangle } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    contacted: "bg-blue-100 text-blue-700",
    confirmed: "bg-green-100 text-green-700",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${colours[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function RegistrantsTable({
  title,
  icon,
  rows,
  loading,
  showSocial = false,
}: {
  title: string;
  icon: React.ReactNode;
  rows: (Volunteer | Influencer)[];
  loading: boolean;
  showSocial?: boolean;
}) {
  return (
    <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
        {icon}
        <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-on-surface">{title}</h3>
        <span className="ml-auto bg-surface-container text-on-surface-variant text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {loading ? "—" : rows.length}
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center font-['Inter'] text-sm text-on-surface-variant">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center font-['Inter'] text-sm text-on-surface-variant">No registrations yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="text-left px-6 py-3 font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Phone</th>
                {showSocial && (
                  <th className="text-left px-6 py-3 font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Social Media</th>
                )}
                <th className="text-left px-6 py-3 font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-['Inter'] font-medium text-on-surface whitespace-nowrap">{row.full_name}</td>
                  <td className="px-6 py-4 font-['Inter'] text-on-surface-variant">{row.email}</td>
                  <td className="px-6 py-4 font-['Inter'] text-on-surface-variant">{row.phone ?? "—"}</td>
                  {showSocial && (
                    <td className="px-6 py-4 font-['Inter'] text-on-surface-variant">
                      {"social_media" in row && row.social_media
                        ? Object.entries(row.social_media)
                            .map(([p, f]) => `${p}: ${Number(f).toLocaleString()}`)
                            .join(", ")
                        : "—"}
                    </td>
                  )}
                  <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
                  <td className="px-6 py-4 font-['Inter'] text-on-surface-variant whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { stocks, orders, donationStats, donations, sponsors, volunteers, influencers, loading, error, refresh } =
    useDashboardData();

  // ── KPI computations ───────────────────────────────────────
  const totalSold = stocks.reduce((sum, s) => sum + (s.starting_stock - s.remaining), 0);
  const totalStarting = stocks.reduce((sum, s) => sum + s.starting_stock, 0);
  const soldPct = totalStarting > 0 ? ((totalSold / totalStarting) * 100).toFixed(1) : "0";

  // "paid" and "paid_backorder" are both fully-paid orders (backorder = paid but
  // awaiting stock), so both count toward revenue.
  const paidOrders = orders.filter((o) => o.status.startsWith("paid"));
  const orderRevenue = paidOrders.reduce((sum, o) => sum + Number(o.amount_paid), 0);

  const totalRWF = Number(donationStats.totalRWF);
  const totalUSD = Number(donationStats.totalUSD);
  const totalRevenue = orderRevenue + totalRWF;

  const completedSponsors = sponsors.filter((s) => s.status === "completed").length;

  const kpiData = [
    {
      title: "Kits Sold",
      value: loading ? "—" : totalSold.toLocaleString(),
      change: loading ? "—" : `${soldPct}% of stock`,
      icon: Shirt,
      trend: (totalSold > 0 ? "up" : "down") as "up" | "down",
      data: stocks.map((s) => s.starting_stock - s.remaining),
    },
    {
      title: "Total Donations",
      value: loading ? "—" : `${totalRWF.toLocaleString()} RWF`,
      change: loading
        ? "—"
        : totalUSD > 0
        ? `+ $${totalUSD.toLocaleString()} USD`
        : `${donationStats.paidDonations} paid`,
      icon: Heart,
      trend: (donationStats.paidDonations > 0 ? "up" : "down") as "up" | "down",
      data: donations.slice(0, 12).map((d) => Number(d.total_amount)),
    },
    {
      title: "Total Sponsors",
      value: loading ? "—" : sponsors.length.toString(),
      change: loading ? "—" : `${completedSponsors} completed`,
      icon: Users,
      trend: (sponsors.length > 0 ? "up" : "down") as "up" | "down",
    },
    {
      title: "Total Revenue",
      value: loading ? "—" : `${totalRevenue.toLocaleString()} RWF`,
      change: loading ? "—" : `${paidOrders.length} paid orders`,
      icon: DollarSign,
      trend: (totalRevenue > 0 ? "up" : "down") as "up" | "down",
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar />

      <div className="flex-1 lg:ml-64 flex flex-col">
        <Header onMenuClick={() => {}} />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface">
                  Dashboard
                </h2>
                <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5">
                  Live data from the Kigali Cancer Walk platform
                </p>
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="font-['Inter'] text-sm text-red-700 flex-1">{error}</p>
                <button
                  onClick={refresh}
                  className="text-sm font-semibold text-red-700 hover:text-red-900 underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiData.map((kpi, index) => (
                <KPICard key={index} {...kpi} loading={loading} />
              ))}
            </div>

            {/* Orders + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentOrdersTable orders={orders} loading={loading} onRefresh={refresh} />
              </div>
              <div>
                <ActivityFeed
                  orders={orders}
                  donations={donations}
                  sponsors={sponsors}
                  loading={loading}
                />
              </div>
            </div>

            {/* Inventory */}
            <KitInventoryTable stocks={stocks} loading={loading} />

            {/* Volunteers */}
            <RegistrantsTable
              title="Volunteer Registrations"
              icon={<Users className="w-5 h-5 text-primary" />}
              rows={volunteers}
              loading={loading}
            />

            {/* Influencers */}
            <RegistrantsTable
              title="Influencer Registrations"
              icon={<Users className="w-5 h-5 text-secondary" />}
              rows={influencers}
              loading={loading}
              showSocial
            />

            {/* Footer */}
            <footer className="border-t border-outline-variant pt-6 mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="font-['Inter'] text-sm text-on-surface-variant">
                  ©2026 Kigali Cancer Walk. All rights reserved.
                </p>
                <p className="font-['Inter'] text-sm text-on-surface-variant">
                  Powered by RGTickets
                </p>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
