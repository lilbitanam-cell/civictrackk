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

const COLORS = ["#1B3A2E", "#263D30", "#718267", "#9AA88E", "#C8C3B4", "#2D5A3F"];

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
        <div className="bg-[#FAF8F2] p-5 rounded-sm border border-[#DDD9CE]">
          <h3 className="font-serif text-base font-medium text-[#252820] mb-3">
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

        <div className="bg-[#FAF8F2] p-5 rounded-sm border border-[#DDD9CE]">
          <h3 className="font-serif text-base font-medium text-[#252820] mb-3">
            Category Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={110} fontSize={11} stroke="#77796F" />
              <Bar dataKey="value" fill="#718267" radius={[0, 3, 3, 0]} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#FAF8F2] p-5 rounded-sm border border-[#DDD9CE]">
        <h3 className="font-serif text-base font-medium text-[#252820] mb-3">
          Monthly Complaint Trend
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="date" fontSize={11} stroke="#77796F" />
            <YAxis fontSize={11} stroke="#77796F" />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#1B3A2E"
              strokeWidth={2}
              dot={{ fill: "#1B3A2E" }}
            />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
