import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Trash2, FileText } from "lucide-react";
import { C, Card, Badge, EmptyState } from "../components/ui";
import { PatientSearchSection } from "../components/PatientSearchSection";
import { reportsApi } from "../services/api";
import type { ReportListItem } from "../types";

export default function AssignedReports() {
  const nav = useNavigate();
  const [reports, setReports] = useState<ReportListItem[]>([]);

  const loadData = () => {
    reportsApi.list().then(setReports).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete report #${id}? This action cannot be undone.`)) {
      try {
        await reportsApi.delete(id);
        loadData();
      } catch (err: any) {
        alert(err?.message || "Failed to delete report.");
      }
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8">
      <h1 className="text-xl font-bold mb-1" style={{ color: C.text }}>My Assigned Reports</h1>
      <p className="text-sm mb-6" style={{ color: C.subtext }}>Sorted by priority — Critical first.</p>

      <PatientSearchSection />

      <Card className="overflow-hidden">
        {reports.length === 0 ? (
          <EmptyState title="No reports assigned" description="Reports assigned to you will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: C.subtext }} className="text-left text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Patient Unique ID</th>
                  <th className="px-5 py-3 font-medium">Patient Name</th>
                  <th className="px-5 py-3 font-medium">Age / Gender</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Uploaded Document</th>
                  <th className="px-5 py-3 font-medium">Risk Score</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Uploaded</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${C.border}` }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-sm text-blue-600">
                      #{r.patient_unique_id || `PT${r.id}`}
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: C.text }}>{r.patient_name}</td>
                    <td className="px-5 py-3.5" style={{ color: C.subtext }}>{r.patient_age} yrs · {r.patient_gender}</td>
                    <td className="px-5 py-3.5">{r.priority && <Badge priority={r.priority} />}</td>
                    <td className="px-5 py-3.5">
                      {r.has_file ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          <FileText size={13} />
                          {r.file_name || `report_${r.id}.pdf`}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: C.subtext }}>No file</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: C.text }}>{r.risk_score ?? "—"}/100</td>
                    <td className="px-5 py-3.5" style={{ color: C.subtext }}>{r.status.replace("_", " ")}</td>
                    <td className="px-5 py-3.5" style={{ color: C.subtext }}>{new Date(r.created_at).toLocaleTimeString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => nav(`/reports/${r.id}`)} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.primary }}>
                          {r.status === "REVIEWED" ? "View" : "Review"} <ChevronRight size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, r.id)}
                          className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                          title="Delete report"
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

