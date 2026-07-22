import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", kitSales: 8, donations: 12, sponsorships: 5 },
  { month: "Feb", kitSales: 12, donations: 15, sponsorships: 8 },
  { month: "Mar", kitSales: 10, donations: 18, sponsorships: 7 },
  { month: "Apr", kitSales: 15, donations: 14, sponsorships: 10 },
  { month: "May", kitSales: 18, donations: 20, sponsorships: 12 },
  { month: "Jun", kitSales: 14, donations: 16, sponsorships: 9 },
  { month: "Jul", kitSales: 16, donations: 19, sponsorships: 11 },
  { month: "Aug", kitSales: 20, donations: 22, sponsorships: 14 },
  { month: "Sep", kitSales: 17, donations: 18, sponsorships: 10 },
  { month: "Oct", kitSales: 19, donations: 21, sponsorships: 13 },
  { month: "Nov", kitSales: 22, donations: 24, sponsorships: 15 },
  { month: "Dec", kitSales: 25, donations: 28, sponsorships: 18 },
];

export function RevenueChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-on-surface">
            Revenue Overview
          </h3>
          <p className="font-['Inter'] text-sm text-on-surface-variant">
            Monthly revenue breakdown
          </p>
        </div>
        <select className="font-['Inter'] text-sm border border-outline-variant rounded-lg px-3 py-2 bg-surface focus:outline-none focus:border-primary">
          <option>This Year</option>
          <option>Last Year</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e2e3" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#4e4351" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#4e4351" }}
            tickFormatter={(value) => `${value}M`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e2e3",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="kitSales"
            stroke="#5e0081"
            strokeWidth={2}
            name="Kit Sales"
            dot={{ fill: "#5e0081" }}
          />
          <Line
            type="monotone"
            dataKey="donations"
            stroke="#b80049"
            strokeWidth={2}
            name="Donations"
            dot={{ fill: "#b80049" }}
          />
          <Line
            type="monotone"
            dataKey="sponsorships"
            stroke="#fabd00"
            strokeWidth={2}
            name="Sponsorships"
            dot={{ fill: "#fabd00" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
