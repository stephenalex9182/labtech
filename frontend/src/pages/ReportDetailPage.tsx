import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserRound, Droplet, Stethoscope, HeartPulse, CheckCircle2, RotateCcw, FileText, Eye, ExternalLink, X, Trash2, Loader2 } from "lucide-react";
import { C, Card, Badge, PrimaryButton, GhostButton, ErrorBanner, PRIORITY_STYLES } from "../components/ui";
import { reportsApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import type { ReportDetail as ReportDetailType } from "../types";

export default function ReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [report, setReport] = useState<ReportDetailType | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const load = async () => {
    if (!id) return;
    try {
      const data = await reportsApi.get(Number(id));
      setReport(data);
      // Doctor opening a pending report moves it into IN_REVIEW automatically.
      if (user?.role === "DOCTOR" && data.status === "PENDING_REVIEW") {
        const updated = await reportsApi.startReview(Number(id));
        setReport(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this report.");
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!report || user?.role !== "DOCTOR" || !report.has_file) {
      setPdfBlobUrl(null);
      setPdfError("");
      return;
    }

    let blobUrl: string | null = null;
    let cancelled = false;

    (async () => {
      setPdfLoading(true);
      setPdfError("");
      try {
        blobUrl = await reportsApi.fetchFileBlobUrl(report.id);
        if (!cancelled) setPdfBlobUrl(blobUrl);
      } catch (e) {
        if (!cancelled) {
          setPdfError(e instanceof Error ? e.message : "Could not load the uploaded document.");
        }
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [report?.id, report?.has_file, user?.role]);

  const act = async (fn: () => Promise<ReportDetailType>) => {
    setBusy(true);
    setError("");
    try {
      const updated = await fn();
      setReport(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    if (window.confirm(`Are you sure you want to delete report #${report.id} for ${report.patient_name}? This action cannot be undone.`)) {
      setBusy(true);
      try {
        await reportsApi.delete(report.id);
        nav(-1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete report.");
        setBusy(false);
      }
    }
  };

  if (error && !report) {
    return (
      <div className="flex-1 p-10">
        <ErrorBanner message={error} />
      </div>
    );
  }
  if (!report) {
    return <div className="flex-1 p-10 text-sm" style={{ color: C.subtext }}>Loading report…</div>;
  }

  const isLabTech = user?.role === "LAB_TECHNICIAN";
  const isDoctor = user?.role === "DOCTOR";
  const priority = report.triage_result?.priority || "NORMAL";
  const s = PRIORITY_STYLES[priority];

  const openPdfInNewTab = () => {
    if (pdfBlobUrl) window.open(pdfBlobUrl, "_blank", "noopener,noreferrer");
  };

  const documentViewer = isDoctor ? (
    <Card className="mb-6 overflow-hidden">
      <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-400 shrink-0" />
          <div>
            <div className="font-semibold text-sm">Original Lab Report (Uploaded by Technician)</div>
            <div className="text-xs text-slate-300">{report.file_name || `report_${report.id}.pdf`}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPdf(true)}
            disabled={!pdfBlobUrl}
            className="text-xs text-blue-300 hover:text-white flex items-center gap-1 font-medium bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            <Eye size={12} /> Fullscreen
          </button>
          <button
            onClick={openPdfInNewTab}
            disabled={!pdfBlobUrl}
            className="text-xs text-blue-300 hover:text-white flex items-center gap-1 font-medium bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            Open in Tab <ExternalLink size={12} />
          </button>
        </div>
      </div>
      <div className="bg-slate-100 p-3 h-[600px]">
        {pdfLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-sm" style={{ color: C.subtext }}>
            <Loader2 size={28} className="animate-spin" color={C.primary} />
            Loading uploaded document…
          </div>
        ) : pdfError ? (
          <div className="h-full flex items-center justify-center p-6">
            <ErrorBanner message={pdfError} />
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            title="Uploaded Lab Report Document"
            className="w-full h-full rounded border border-slate-300 bg-white"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm" style={{ color: C.subtext }}>
            No uploaded document is available for this report.
          </div>
        )}
      </div>
    </Card>
  ) : null;

  return (
    <div className="flex-1 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => nav(-1)} className="text-xs font-semibold" style={{ color: C.subtext }}>← Back</button>
          
          <div className="flex items-center gap-2">
            {isDoctor && report.has_file && (
              <button
                onClick={() => setShowPdf(true)}
                disabled={!pdfBlobUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <Eye size={14} /> View Uploaded PDF
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete Report
            </button>
          </div>
        </div>

        <ErrorBanner message={error} />

        <Card className="p-6 mb-6">
          <div className="grid sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            <Info label="Patient Unique ID" value={`#${report.patient_unique_id || `PT${report.id}`}`} highlight />
            <Info label={isLabTech ? "Patient Identifier (Anonymized)" : "Patient Name"} value={report.patient_name} />
            <Info label="Age / Gender" value={`${report.patient_age} · ${report.patient_gender}`} />
            <Info label="Report ID" value={`#${report.id}`} />
            {isDoctor && <Info label="Uploaded Document" value={report.file_name || `report_${report.id}.pdf`} highlight />}
            {!isDoctor && <Info label="Uploaded File" value={report.file_name || `report_${report.id}.pdf`} />}
            <Info label="Assigned Doctor" value={report.assigned_doctor_name || "Auto-assigning…"} />
            <Info label="Upload Time" value={new Date(report.created_at).toLocaleString()} />
          </div>
        </Card>

        {isLabTech ? (
          <Card className="p-6 mb-6 text-center" style={{ background: "#EFF6FF", border: `1px solid #BFDBFE` }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <UserRound size={18} color={C.primary} />
              <span className="text-base font-bold" style={{ color: C.text }}>Report Uploaded & Auto-Allocated</span>
            </div>
            <p className="text-xs" style={{ color: C.subtext }}>
              Direct notification dispatched to <strong style={{ color: C.primary }}>{report.assigned_doctor_name || "Doctor"}</strong>. Risk analysis is reserved for attending physicians.
            </p>
          </Card>
        ) : (
          <Card className="p-8 mb-6 text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <UserRound size={16} color={C.subtext} />
              <span className="text-sm font-medium" style={{ color: C.subtext }}>Report Status: {report.status.replace("_", " ")}</span>
            </div>
            <Badge priority={priority} size="lg" />
            <div className="mt-6">
              <div className="text-xs font-semibold mb-1" style={{ color: C.subtext }}>OVERALL RISK SCORE</div>
              <div className="text-4xl font-bold" style={{ color: s.color }}>
                {report.triage_result?.risk_score ?? 0}<span className="text-lg" style={{ color: C.subtext }}>/100</span>
              </div>
              <div className="w-full max-w-xs mx-auto h-2 rounded-full mt-3" style={{ background: "white" }}>
                <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${report.triage_result?.risk_score ?? 0}%`, background: s.color }} />
              </div>
            </div>
          </Card>
        )}

        {documentViewer}

        <Card className="mb-6 overflow-hidden">
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: C.text }}><Droplet size={16} color={C.primary} /> Measured Laboratory Values</h3>
            {isDoctor && report.has_file && (
              <button
                onClick={() => setShowPdf(true)}
                disabled={!pdfBlobUrl}
                className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <ExternalLink size={12} /> Compare with uploaded PDF
              </button>
            )}
          </div>
          {report.lab_results.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: C.subtext }}>No values were extracted from this report.</div>
          ) : (
            report.lab_results.map((f) => {
              const fs = PRIORITY_STYLES[f.severity as keyof typeof PRIORITY_STYLES] || PRIORITY_STYLES.NORMAL;
              return (
                <div key={f.test_name} className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div>
                    <div className="font-medium text-sm" style={{ color: C.text }}>{f.test_name}</div>
                    <div className="text-xs mt-0.5" style={{ color: C.subtext }}>
                      Reference: {f.reference_min ?? "—"}–{f.reference_max ?? "—"} {f.unit || ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm" style={{ color: C.text }}>{f.value} {f.unit || ""}</div>
                    {!isLabTech && <span className="text-xs font-semibold" style={{ color: fs.color }}>{f.severity}</span>}
                  </div>
                </div>
              );
            })
          )}
        </Card>

        {!isLabTech && (
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <Card className="p-6">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-4" style={{ color: C.text }}><Stethoscope size={16} color={C.secondary} /> AI Clinical Summary</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.text }}>
                {report.triage_result?.ai_summary || "No summary available."}
              </p>
              <p className="text-[11px] mt-3" style={{ color: C.subtext }}>AI-generated from uploaded PDF — requires professional review, not a diagnosis.</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-4" style={{ color: C.text }}><HeartPulse size={16} color={C.critical} /> Recommended Actions</h3>
              <ul className="space-y-2.5">
                {report.recommendations.map((l, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: C.text }}>
                    <CheckCircle2 size={15} color={C.normal} className="shrink-0 mt-0.5" />
                    {l}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {user?.role === "DOCTOR" && report.status !== "REVIEWED" && (
          <div className="flex flex-wrap justify-end gap-3">
            <GhostButton onClick={() => act(() => reportsApi.returnToQueue(report.id))}>
              <RotateCcw size={15} /> Return to Queue
            </GhostButton>
            <PrimaryButton onClick={() => act(() => reportsApi.markReviewed(report.id))} disabled={busy}>
              <FileText size={15} /> Mark as Reviewed
            </PrimaryButton>
          </div>
        )}
        {report.status === "REVIEWED" && (
          <div className="flex justify-end">
            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.normal }}>
              <CheckCircle2 size={15} /> Reviewed
            </span>
          </div>
        )}
      </div>

      {/* PDF Document Viewing Modal */}
      {showPdf && pdfBlobUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                <span className="font-medium text-sm">Uploaded PDF: {report.file_name || `report_${report.id}.pdf`} — {report.patient_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={openPdfInNewTab}
                  className="text-xs text-blue-300 hover:text-white flex items-center gap-1"
                >
                  Open in tab <ExternalLink size={12} />
                </button>
                <button
                  onClick={() => setShowPdf(false)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-2">
              <iframe
                src={pdfBlobUrl}
                title="Uploaded PDF Document"
                className="w-full h-full rounded border border-slate-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function Info({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold" style={{ color: C.subtext }}>{label}</div>
      <div className={`text-sm mt-0.5 ${highlight ? "font-mono font-bold text-blue-600" : ""}`} style={{ color: highlight ? C.primary : C.text }}>{value}</div>
    </div>
  );
}
