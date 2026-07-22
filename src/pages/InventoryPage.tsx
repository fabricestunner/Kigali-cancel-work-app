import { useEffect, useState } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Download,
  Search,
  Plus,
  X,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getStock, createStock, updateStock, type Stock } from "../services/stock.service";

/* =========================
   TYPES
========================= */

interface InventoryItem {
  id: number;
  size: string;
  quantity: number;
  available: number;
  threshold: number;
  status: "healthy" | "low" | "critical";
}

/* =========================
   COLORS
========================= */

const COLORS = {
  primary: "#5e0081",
};

/* =========================
   COMPONENT
========================= */

export function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "critical">(
    "all",
  );

  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"restock" | "add">("restock");
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newQty, setNewQty] = useState("");

  /* =========================
     FETCH STOCK
  ========================== */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res: Stock[] = await getStock();

        const mapped: InventoryItem[] = res.map((i) => {
          const threshold = Math.floor(i.starting_stock * 0.2);

          return {
            id: i.id,
            size: i.item,
            quantity: i.starting_stock,
            available: i.remaining,
            threshold,
            status:
              i.remaining <= threshold
                ? i.remaining <= threshold / 2
                  ? "critical"
                  : "low"
                : "healthy",
          };
        });

        setInventoryData(mapped);
      } catch (e) {
        setError("Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* =========================
     RESTOCK
  ========================== */

  const handleRestock = async () => {
    if (!selectedSize || !qty) return;

    const amount = Number(qty);

    const item = inventoryData.find((i) => i.size === selectedSize);
    if (!item) return;

    await updateStock(item.id, {
      starting_stock: item.quantity + amount,
      remaining: item.available + amount,
    });

    const updated = await getStock();

    const mapped: InventoryItem[] = updated.map((i) => {
      const threshold = Math.floor(i.starting_stock * 0.2);

      return {
        id: i.id,
        size: i.item,
        quantity: i.starting_stock,
        available: i.remaining,
        threshold,
        status:
          i.remaining <= threshold
            ? i.remaining <= threshold / 2
              ? "critical"
              : "low"
            : "healthy",
      };
    });

    setInventoryData(mapped);
    setIsModalOpen(false);
    setSelectedSize("");
    setQty("");
  };

  /* =========================
     ADD NEW SIZE
  ========================== */

  const handleAddSize = async () => {
    if (!newSize.trim() || !newQty) return;
    const amount = Number(newQty);
    await createStock({ item: newSize.trim().toUpperCase(), starting_stock: amount, remaining: amount });
    const updated = await getStock();
    setInventoryData(updated.map((i) => {
      const threshold = Math.floor(i.starting_stock * 0.2);
      return {
        id: i.id, size: i.item, quantity: i.starting_stock, available: i.remaining, threshold,
        status: i.remaining <= threshold ? (i.remaining <= threshold / 2 ? "critical" : "low") : "healthy",
      };
    }));
    setIsModalOpen(false);
    setNewSize("");
    setNewQty("");
  };

  /* =========================
     FILTERS
  ========================== */

  const filtered = inventoryData.filter((i) => {
    const matchSearch = i.size
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchFilter =
      filterStatus === "all" ||
      (filterStatus === "low" && i.status === "low") ||
      (filterStatus === "critical" && i.status === "critical");

    return matchSearch && matchFilter;
  });

  const total = inventoryData.reduce((a, b) => a + b.quantity, 0);
  const available = inventoryData.reduce((a, b) => a + b.available, 0);
  const lowCount = inventoryData.filter((i) => i.status !== "healthy").length;

  const chartData = inventoryData.map((i) => ({
    name: i.size,
    value: i.available,
  }));

  /* =========================
     STATES
  ========================== */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading inventory...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  /* =========================
     UI
  ========================== */

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 lg:ml-64 flex flex-col">
        <Header />

        <main className="p-4 sm:p-6 space-y-6">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Inventory Management
              </h1>
              <p className="text-sm text-gray-500">
                Real-time stock tracking system
              </p>
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border rounded-xl flex items-center gap-2 text-sm">
                <Download size={16} /> Export
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 text-sm hover:bg-purple-700"
              >
                <Plus size={16} /> Restock
              </button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard title="Total Stock" value={total} icon={<Package />} />
            <KpiCard
              title="Available"
              value={available}
              icon={<TrendingUp />}
            />
            <KpiCard
              title="Low Stock"
              value={lowCount}
              icon={<AlertTriangle />}
              danger
            />
          </div>

          {/* SEARCH + FILTER */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1">
              <Search size={16} className="text-gray-400" />
              <input
                className="w-full outline-none text-sm"
                placeholder="Search size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="border rounded-xl px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="low">Low Stock</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-100 text-left text-sm">
                <tr>
                  <th className="p-3">Size</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-t text-sm">
                    <td className="p-3 font-medium">{i.size}</td>
                    <td className="p-3">{i.quantity}</td>
                    <td className="p-3 text-purple-600 font-semibold">
                      {i.available}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CHART */}
          <div className="bg-white rounded-2xl p-4">
            <h2 className="font-semibold mb-3">Stock Distribution</h2>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MODAL */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">Stock Management</h2>
                  <button onClick={() => setIsModalOpen(false)}><X /></button>
                </div>

                {/* Tabs */}
                <div className="flex border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setModalTab("restock")}
                    className={`flex-1 py-2 text-sm font-medium transition ${modalTab === "restock" ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    Restock
                  </button>
                  <button
                    onClick={() => setModalTab("add")}
                    className={`flex-1 py-2 text-sm font-medium transition ${modalTab === "add" ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    Add Size
                  </button>
                </div>

                {modalTab === "restock" ? (
                  <>
                    <select
                      className="w-full border rounded-xl p-2"
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                    >
                      <option value="">Select size</option>
                      {inventoryData.map((i) => (
                        <option key={i.id} value={i.size}>{i.size}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="w-full border rounded-xl p-2"
                      placeholder="Quantity to add"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                    />
                    <button
                      onClick={handleRestock}
                      className="w-full bg-purple-600 text-white py-2 rounded-xl hover:bg-purple-700"
                    >
                      Confirm Restock
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      className="w-full border rounded-xl p-2"
                      placeholder="Size label (e.g. S, M, L, XL)"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-full border rounded-xl p-2"
                      placeholder="Initial stock quantity"
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                    />
                    <button
                      onClick={handleAddSize}
                      className="w-full bg-purple-600 text-white py-2 rounded-xl hover:bg-purple-700"
                    >
                      Add Size
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function KpiCard({
  title,
  value,
  icon,
  danger,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-xl font-bold">{value}</h3>
      </div>
      <div className={danger ? "text-red-500" : "text-purple-600"}>{icon}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    healthy: "bg-green-100 text-green-700",
    low: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${map[status]}`}>
      {status}
    </span>
  );
}
