import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Clock, CheckCircle2, FileText, UserCheck, ShieldCheck, Trash2, Eye } from "lucide-react";
import { C, Card, StatCard, PrimaryButton, EmptyState } from "../components/ui";
import { dashboardApi, reportsApi } from "../services/api";
import type { DashboardCounts, ReportListItem } from "../types";

export default function LabDashboard() {
  const nav = useNavigate();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);

  const loadData = () => {
    dashboardApi.lab().then(setCounts).catch(() => {});
    reportsApi.list().then(setReports).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete report #${id}? This will permanently remove the uploaded file and data.`)) {
      try {
        await reportsApi.delete(id);
        loadData();
      } catch (err: any) {
        alert(err?.message || "Failed to delete report.");
      }
    }
  };

  const totalUploaded = reports.length;

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.text }}>Lab Technician Dashboard</h1>
          <p className="text-sm" style={{ color: C.subtext }}>Upload patient lab reports. Doctors are automatically allocated and directly notified.</p>
        </div>
        <PrimaryButton onClick={() => nav("/lab/upload")}><Upload size={15} /> Upload Report</PrimaryButton>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Uploads" value={totalUploaded} icon={FileText} color={C.primary} />
        <StatCard label="Pending Doctor Review" value={counts?.pending_review ?? "—"} icon={Clock} color={C.medium} />
        <StatCard label="Reviewed Today" value={counts?.reviewed_today ?? "—"} icon={CheckCircle2} color={C.normal} />
        <StatCard label="Auto-Doctor Allocation" value="Active" icon={UserCheck} color={C.secondary} />
      </div>

      <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
        <span><strong>Patient Privacy Compliance Active:</strong> Patient names are anonymized on lab technician views. Full patient identity & PDF reports are reserved for attending doctors.</span>
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: C.text }}>Lab Technician Upload History</h3>
            <p className="text-xs" style={{ color: C.subtext }}>Unique 6-character ID allocated for each entry</p>
          </div>
        </div>
        {reports.length === 0 ? (
          <EmptyState title="No reports uploaded yet" description="Upload a lab report to see patient entries here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: C.subtext }} className="text-left text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Patient Unique ID</th>
                  <th className="px-5 py-3 font-medium">Patient Identifier (Anonymized)</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Allocated Doctor</th>
                  <th className="px-5 py-3 font-medium">Uploaded Time</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${C.border}` }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded inline-block" style={{ background: "#EFF6FF", color: C.primary, border: `1px solid #BFDBFE` }}>
                        #{r.patient_unique_id || `PT${r.id}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium" style={{ color: C.text }}>{r.patient_name}</td>
                    <td className="px-5 py-3.5" style={{ color: C.subtext }}>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#F1F5F9", color: C.text }}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium" style={{ color: C.primary }}>
                      {r.assigned_doctor_name ? (
                        <span className="flex items-center gap-1.5">
                          <UserCheck size={14} color={C.secondary} />
                          {r.assigned_doctor_name}
                        </span>
                      ) : "Auto-allocating…"}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: C.subtext }}>{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => nav(`/reports/${r.id}`)}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, r.id)}
                          className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                          title="Delete uploaded report"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
