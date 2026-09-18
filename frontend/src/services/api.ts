// Central API service layer — every network call goes through here, never
// scattered directly inside components, per the project's structure rule.
import type {
  User, ReportListItem, ReportDetail, DashboardCounts, NotificationOut, ActivityOut, PatientHistoryItem,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("labtriage_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("labtriage_token", token);
  else localStorage.removeItem("labtriage_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "Backend server is offline or unreachable at http://127.0.0.1:8000. Please start the backend server.",
      503
    );
  }

  if (!res.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const bodyText = await res.text();
      if (bodyText.includes("ECONNREFUSED") || res.status === 502 || res.status === 504) {
        detail = "Backend server is offline! Please start the backend: cd backend && python -m uvicorn app.main:app --reload --port 8000";
      } else {
        const body = JSON.parse(bodyText);
        detail = body.detail || detail;
      }
    } catch {
      if (res.status === 502 || res.status === 504) {
        detail = "Backend server is offline! Please start the backend: cd backend && python -m uvicorn app.main:app --reload --port 8000";
      }
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>("/api/auth/me"),
};

export const reportsApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ReportListItem>("/api/reports/upload", { method: "POST", body: form });
  },
  list: () => request<ReportListItem[]>("/api/reports"),
  get: (id: number) => request<ReportDetail>(`/api/reports/${id}`),
  getFileUrl: (id: number) => `${BASE_URL}/api/reports/${id}/file`,
  fetchFileBlobUrl: async (id: number): Promise<string> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/api/reports/${id}/file`, { headers });
    } catch {
      throw new ApiError("Could not load the uploaded document. Please check that the backend is running.", 503);
    }

    if (!res.ok) {
      throw new ApiError("Could not load the uploaded document.", res.status);
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
  searchPatientHistory: (query: string) =>
    request<PatientHistoryItem[]>(`/api/reports/patient-search?q=${encodeURIComponent(query)}`),
  startReview: (id: number) => request<ReportDetail>(`/api/reports/${id}/review`, { method: "POST" }),
  markReviewed: (id: number) => request<ReportDetail>(`/api/reports/${id}/mark-reviewed`, { method: "POST" }),
  returnToQueue: (id: number) => request<ReportDetail>(`/api/reports/${id}/return-to-queue`, { method: "POST" }),
  delete: (id: number) => request<{ message: string }>(`/api/reports/${id}`, { method: "DELETE" }),
};

export const dashboardApi = {
  doctor: () => request<DashboardCounts>("/api/dashboard/doctor"),
  lab: () => request<DashboardCounts>("/api/dashboard/lab"),
};

export const notificationsApi = {
  list: () => request<NotificationOut[]>("/api/notifications"),
  markRead: (id: number) => request<NotificationOut>(`/api/notifications/${id}/read`, { method: "POST" }),
};

export const activityApi = {
  mine: () => request<ActivityOut[]>("/api/activity/my"),
};

export const analyticsApi = {
  get: () => request<{ total_reports: number; priority_distribution: Record<string, number>; average_risk_score: number }>("/api/analytics"),
};

export { ApiError };
