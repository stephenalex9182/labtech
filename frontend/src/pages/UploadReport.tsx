import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, ClipboardList, CheckCircle2 } from "lucide-react";
import { C, Card, PrimaryButton, GhostButton, ErrorBanner } from "../components/ui";
import { reportsApi } from "../services/api";

const PROCESS_STEPS = [
  "Uploading Report...",
  "Extracting Patient Details from PDF...",
  "Extracting Laboratory Values...",
  "Allocating 6-Char Unique Patient ID...",
  "Allocating Doctor Automatically...",
  "Sending Direct Doctor Notification...",
  "Completed. Doctor Notified.",
];

export default function UploadReport() {
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<"form" | "processing" | "success">("form");
  const [step, setStep] = useState(0);
  const [assignedDoctor, setAssignedDoctor] = useState<string | null>(null);
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const canSubmit = !!file;

  const submit = async () => {
    if (!canSubmit || !file) return;
    setError("");
    setPhase("processing");
    setStep(0);
    try {
      const report = await reportsApi.upload(file);
      setAssignedDoctor(report.assigned_doctor_name || "Doctor");
      setUniqueId(report.patient_unique_id);
    } catch (e: unknown) {
      setPhase("form");
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    }
  };

  useEffect(() => {
    if (phase !== "processing") return;
    if (step >= PROCESS_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setPhase("success");
      }, 500);
      return () => clearTimeout(timer);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 450);
    return () => clearTimeout(t);
  }, [phase, step]);

  if (phase === "success") {
    return (
      <div className="flex-1 flex items-center justify-center p-10" style={{ minHeight: "70vh" }}>
        <Card className="p-10 w-full max-w-md text-center">
          <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#ECFDF5" }}>
            <CheckCircle2 size={32} color={C.normal} />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color: C.text }}>Report Uploaded Successfully!</h3>
          <p className="text-sm mb-4" style={{ color: C.subtext }}>
            Patient entry allocated Unique ID:{" "}
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              #{uniqueId}
            </span>
          </p>
          <p className="text-xs mb-4 px-2" style={{ color: C.subtext }}>
            Patient name, age, and gender were extracted from the PDF and are visible to the assigned doctor only.
          </p>
          <div className="p-4 rounded-xl mb-6 text-left" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Doctor Auto-Allocated</div>
            <div className="text-sm font-semibold text-blue-950">
              {assignedDoctor}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Direct notification dispatched automatically to the doctor's inbox.
            </div>
          </div>
          <PrimaryButton onClick={() => nav("/lab")} className="w-full">
            Back to Dashboard
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <div className="flex-1 flex items-center justify-center p-10" style={{ minHeight: "70vh" }}>
        <Card className="p-10 w-full max-w-md text-center">
          <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#EFF6FF" }}>
            <FileUp size={26} color={C.primary} />
          </div>
          <h3 className="font-semibold text-base mb-6" style={{ color: C.text }}>Analyzing lab report</h3>
          <div className="space-y-3 text-left">
            {PROCESS_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3 transition-opacity duration-300" style={{ opacity: i <= step ? 1 : 0.35 }}>
                {i < step ? (
                  <CheckCircle2 size={17} color={C.normal} />
                ) : i === step ? (
                  <div className="h-4 w-4 rounded-full border-2 animate-spin" style={{ borderColor: C.primary, borderTopColor: "transparent" }} />
                ) : (
                  <div className="h-4 w-4 rounded-full" style={{ border: `2px solid ${C.border}` }} />
                )}
                <span className="text-sm" style={{ color: i <= step ? C.text : C.subtext }}>{s}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-1" style={{ color: C.text }}>Upload Lab Report</h1>
        <p className="text-sm mb-6" style={{ color: C.subtext }}>
          Upload a PDF or image — LabTriage AI automatically extracts the patient name, age, gender, and lab values from the document.
        </p>

        <ErrorBanner message={error} />

        <Card
          className="p-10 text-center mb-6"
          style={{ borderStyle: "dashed", borderWidth: 2, borderColor: dragOver ? C.primary : C.border, background: dragOver ? "#EFF6FF" : "white" }}
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
          >
            <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#EFF6FF" }}>
              <FileUp size={24} color={C.primary} />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: C.text }}>{file ? file.name : "Drag and drop your report here"}</p>
            <p className="text-xs mb-5" style={{ color: C.subtext }}>Supports PDF, JPG, PNG and TXT, up to 20MB. No manual patient entry required.</p>
            <label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
              <span className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer" style={{ color: C.text, border: `1px solid ${C.border}`, background: "white" }}>
                <ClipboardList size={15} /> Choose File
              </span>
            </label>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <GhostButton onClick={() => nav(-1)}>Cancel</GhostButton>
          <PrimaryButton onClick={submit} disabled={!canSubmit}>Analyze Report</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
