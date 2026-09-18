import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { FileText, Gauge } from "lucide-react";
import { C, Card, StatCard } from "../components/ui";
import { analyticsApi } from "../services/api";

export default function Analytics() {
  const [data, setData] = useState<{ total_reports: number; priority_distribution: Record<string, number>; average_risk_score: number } | null>(null);

  useEffect(() => {
    analyticsApi.get().then(setData).catch(() => {});
  }, []);

  const pieData = data
    ? [
        { name: "Critical", value: data.priority_distribution.CRITICAL || 0, color: C.critical },
        { name: "High", value: data.priority_distribution.HIGH || 0, color: C.high },
        { name: "Medium", value: data.priority_distribution.MEDIUM || 0, color: C.medium },
        { name: "Normal", value: data.priority_distribution.NORMAL || 0, color: C.normal },
      ]
    : [];

  return (
    <div className="flex-1 p-6 lg:p-8">
      <h1 className="text-xl font-bold mb-1" style={{ color: C.text }}>Analytics</h1>
      <p className="text-sm mb-6" style={{ color: C.subtext }}>Aggregate view across all triaged reports.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <StatCard label="Total Reports" value={data?.total_reports ?? "—"} icon={FileText} color={C.primary} />
        <StatCard label="Average Risk Score" value={data?.average_risk_score ?? "—"} icon={Gauge} color={C.secondary} />
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-sm mb-4" style={{ color: C.text }}>Priority Distribution</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {pieData.map((d) => <Cell key={d.name} fill={d.color} stroke="white" strokeWidth={2} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs" style={{ color: C.subtext }}>
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name} ({d.value})
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
