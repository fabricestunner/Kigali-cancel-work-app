import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { QrCode } from "lucide-react";

const data = [
  { name: "Checked In", value: 2350, color: "#5e0081" },
  { name: "Not Checked In", value: 2650, color: "#e5e2e3" },
];

export function ParticipantsCheckIn() {
  const percentage = Math.round((data[0].value / 5000) * 100);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant">
      <div className="mb-6">
        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-on-surface">
          Participants Check-in
        </h3>
        <p className="font-['Inter'] text-sm text-on-surface-variant">
          Checked in Today May 31, 2026
        </p>
      </div>
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-4">
          <div className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-on-surface">
            {data[0].value} / 5,000
          </div>
          <div className="font-['Inter'] text-lg text-primary font-semibold mt-1">
            {percentage}%
          </div>
        </div>
        <button className="mt-6 w-full bg-gradient-to-r from-primary to-secondary text-white font-['Inter'] text-sm font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-shadow">
          <QrCode className="w-5 h-5" />
          Scan QR Code
        </button>
      </div>
    </div>
  );
}
