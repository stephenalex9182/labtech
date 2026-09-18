export type Role = "LAB_TECHNICIAN" | "DOCTOR";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL";
export type ReportStatus = "UPLOADED" | "AI_ANALYZING" | "PENDING_REVIEW" | "IN_REVIEW" | "REVIEWED";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  specialty?: string | null;
}

export interface ReportListItem {
  id: number;
  patient_name: string;
  patient_unique_id: string;
  patient_age: number;
  patient_gender: string;
  priority: Priority | null;
  risk_score: number | null;
  status: ReportStatus;
  assigned_doctor_name: string | null;
  created_at: string;
  has_file?: boolean;
  file_name?: string | null;
}

export interface LabResultOut {
  test_name: string;
  value: number;
  unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  severity: string;
}

export interface TriageResultOut {
  risk_score: number;
  priority: Priority;
  ai_summary: string | null;
}

export interface ReportDetail {
  id: number;
  patient_name: string;
  patient_unique_id: string;
  patient_age: number;
  patient_gender: string;
  uploaded_by_name: string;
  assigned_doctor_name: string | null;
  status: ReportStatus;
  created_at: string;
  lab_results: LabResultOut[];
  triage_result: TriageResultOut | null;
  recommendations: string[];
  has_file?: boolean;
  file_name?: string | null;
}

export interface PatientHistoryReport {
  id: number;
  file_name: string | null;
  status: ReportStatus;
  priority: Priority | null;
  risk_score: number | null;
  ai_summary: string | null;
  created_at: string;
  lab_results: LabResultOut[];
}

export interface PatientHistoryItem {
  patient_id: number;
  unique_id: string;
  name: string;
  age: number;
  gender: string;
  reports: PatientHistoryReport[];
}


export interface DashboardCounts {
  critical: number;
  high: number;
  medium: number;
  normal: number;
  pending_review: number;
  reviewed_today: number;
}

export interface NotificationOut {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  report_id: number | null;
}

export interface ActivityOut {
  id: number;
  action: string;
  description: string;
  created_at: string;
}
