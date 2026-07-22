import type { StockItem } from "../../hooks/useDashboardData";

interface KitInventoryTableProps {
  stocks: StockItem[];
  loading?: boolean;
}

function getStatus(remaining: number, starting: number): "Available" | "Low Stock" | "Very Low" | "Out of Stock" {
  if (remaining === 0) return "Out of Stock";
  const pct = (remaining / starting) * 100;
  if (pct > 30) return "Available";
  if (pct > 10) return "Low Stock";
  return "Very Low";
}

const statusColors = {
  Available: "bg-green-100 text-green-700",
  "Low Stock": "bg-yellow-100 text-yellow-700",
  "Very Low": "bg-red-100 text-red-700",
  "Out of Stock": "bg-gray-100 text-gray-500",
};

export function KitInventoryTable({ stocks, loading }: KitInventoryTableProps) {
  const totalAvailable = stocks.reduce((sum, s) => sum + s.remaining, 0);
  const totalSold = stocks.reduce((sum, s) => sum + (s.starting_stock - s.remaining), 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-6" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between py-3 border-b border-outline-variant">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-1/6" />
            <div className="h-4 bg-gray-100 rounded w-1/6" />
            <div className="h-6 bg-gray-100 rounded-full w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant">
        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-on-surface mb-1">Kit Inventory Status</h3>
        <p className="font-['Inter'] text-sm text-on-surface-variant mb-6">Current stock levels</p>
        <p className="text-center text-on-surface-variant py-8 text-sm">No stock items found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant">
      <div className="mb-6">
        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-on-surface">
          Kit Inventory Status
        </h3>
        <p className="font-['Inter'] text-sm text-on-surface-variant">
          Current stock levels
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="text-left font-['Inter'] text-xs font-semibold text-on-surface-variant py-3 uppercase tracking-wide">Item</th>
              <th className="text-right font-['Inter'] text-xs font-semibold text-on-surface-variant py-3 uppercase tracking-wide">Available</th>
              <th className="text-right font-['Inter'] text-xs font-semibold text-on-surface-variant py-3 uppercase tracking-wide">Sold</th>
              <th className="text-right font-['Inter'] text-xs font-semibold text-on-surface-variant py-3 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((item) => {
              const sold = item.starting_stock - item.remaining;
              const status = getStatus(item.remaining, item.starting_stock);
              const soldPct = item.starting_stock > 0 ? Math.round((sold / item.starting_stock) * 100) : 0;
              return (
                <tr key={item.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                  <td className="py-3">
                    <span className="font-['Inter'] text-sm font-medium text-on-surface">{item.item}</span>
                    <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${sold > 0 ? "bg-primary" : "bg-gray-200"}`}
                        style={{ width: `${soldPct}%` }}
                      />
                    </div>
                  </td>
                  <td className="font-['Inter'] text-sm text-on-surface text-right py-3">{item.remaining.toLocaleString()}</td>
                  <td className="font-['Inter'] text-sm text-on-surface text-right py-3">{sold.toLocaleString()}</td>
                  <td className="text-right py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-surface-container-low font-semibold">
              <td className="font-['Inter'] text-sm text-on-surface py-3">Total</td>
              <td className="font-['Inter'] text-sm text-on-surface text-right py-3">{totalAvailable.toLocaleString()}</td>
              <td className="font-['Inter'] text-sm text-on-surface text-right py-3">{totalSold.toLocaleString()}</td>
              <td className="py-3" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
