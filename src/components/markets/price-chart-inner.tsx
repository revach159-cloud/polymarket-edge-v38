"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function PriceChartInner({
  points,
  label,
}: {
  points: { t: number; p: number }[];
  label: string;
}) {
  const data = points.map((p) => ({
    time: new Date(p.t * (p.t < 1e12 ? 1000 : 1)).toLocaleString("he-IL", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    price: Number((p.p * 100).toFixed(2)),
  }));

  return (
    <div className="h-64 w-full rounded-xl border border-border bg-card p-3" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            minTickGap={40}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 8,
              direction: "rtl",
            }}
            formatter={(value) => [`${value}%`, label]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#2DD4BF"
            fill="url(#priceFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
