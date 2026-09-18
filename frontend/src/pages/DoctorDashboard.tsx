import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertOctagon, AlertTriangle, Clock, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { C, Card, StatCard, Badge, EmptyState } from "../components/ui";
import { PatientSearchSection } from "../components/PatientSearchSection";
import { dashboardApi, reportsApi } from "../services/api";
import type { DashboardCounts, ReportListItem } from "../types";

export default function DoctorDashboard() {
  const nav = useNavigate();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);

  useEffect(() => {
    dashboardApi.doctor().then(setCounts).catch(() => {});
    reportsApi.list().then(setReports).catch(() => {});
  }, []);

  const topQueue = reports.filter((r) => r.status !== "REVIEWED").slice(0, 6);

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: C.text }}>Doctor Dashboard</h1>
        <p className="text-sm" style={{ color: C.subtext }}>Reports assigned to you, sorted by urgency.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Critical Reports" value={counts?.critical ?? "—"} icon={AlertOctagon} color={C.critical} />
        <StatCard label="High Priority" value={counts?.high ?? "—"} icon={AlertTriangle} color={C.high} />
        <StatCard label="Pending Review" value={counts?.pending_review ?? "—"} icon={Clock} color={C.medium} />
        <StatCard label="Reviewed Today" value={counts?.reviewed_today ?? "—"} icon={CheckCircle2} color={C.normal} />
      </div>

      <PatientSearchSection />

      <Card className="overflow-hidden">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="font-semibold text-sm" style={{ color: C.text }}>Priority Queue</h3>
          <button className="text-xs font-semibold" style={{ color: C.primary }} onClick={() => nav("/doctor/reports")}>View all</button>
        </div>
        {topQueue.length === 0 ? (
          <EmptyState title="Queue is clear" description="No pending reports assigned to you right now." />
        ) : (
          topQueue.map((r) => (
            <button key={r.id} onClick={() => nav(`/reports/${r.id}`)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left" style={{ borderTop: `1px solid ${C.border}` }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">{r.patient_name}</span>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    #{r.patient_unique_id || `PT${r.id}`}
                  </span>
                </div>
                <div className="text-xs mt-1" style={{ color: C.subtext }}>{r.patient_age} yrs · {r.patient_gender} · {r.status.replace("_", " ")}</div>
                {r.has_file && (
                  <div className="text-xs mt-1.5 inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                    <FileText size={12} />
                    {r.file_name || `report_${r.id}.pdf`}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {r.priority && <Badge priority={r.priority} />}
                <ChevronRight size={15} color={C.subtext} />
              </div>
            </button>
          ))
        )}
      </Card>
    </div>
  );
}
