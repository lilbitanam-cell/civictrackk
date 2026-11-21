"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#788568", "#536247", "#3E4B37", "#B4BBA5", "#E5E8DF", "#30352D"];

interface Props {
  statusData: { name: string; value: number }[];
  categoryData: { name: string; value: number }[];
  monthlyData: { date: string; count: number }[];
}

export default function AdminDashboardCharts({
  statusData,
  categoryData,
  monthlyData,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border border-[#E5E8DF] shadow-xs">
          <h3 className="text-sm font-semibold text-[#30352D] mb-3">
            Complaint Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                outerRadius={85}
                label
              >
                {statusData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E5E8DF] shadow-xs">
          <h3 className="text-sm font-semibold text-[#30352D] mb-3">
            Category Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={110} fontSize={11} />
              <Bar dataKey="value" fill="#788568" radius={[0, 4, 4, 0]} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-[#E5E8DF] shadow-xs">
        <h3 className="text-sm font-semibold text-[#30352D] mb-3">
          Monthly Complaint Trend
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="date" fontSize={11} stroke="#74796F" />
            <YAxis fontSize={11} stroke="#74796F" />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#536247"
              strokeWidth={2}
              dot={{ fill: "#536247" }}
            />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
