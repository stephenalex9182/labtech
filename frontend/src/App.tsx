import React, { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthContext } from "./hooks/useAuth";
import { authApi, setToken } from "./services/api";
import type { User } from "./types";

import Login from "./pages/Login";
import LabDashboard from "./pages/LabDashboard";
import UploadReport from "./pages/UploadReport";
import DoctorDashboard from "./pages/DoctorDashboard";
import AssignedReports from "./pages/AssignedReports";
import MyActivity from "./pages/MyActivity";
import ReportDetailPage from "./pages/ReportDetailPage";
import Analytics from "./pages/Analytics";
import ClinicalIntelligence from "./pages/ClinicalIntelligence";
import SecurityCompliance from "./pages/SecurityCompliance";
import { Sidebar, TopBar } from "./components/Shell";
import { C } from "./components/ui";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <TopBar />
      <div className="flex">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}

function useProvideAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("labtriage_token")) {
      setLoading(false);
      return;
    }
    authApi.me().then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}

export default function App() {
  const auth = useProvideAuth();

  if (auth.loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: C.subtext, background: C.bg }}>Loading LabTriage AIâ€¦</div>;
  }

  return (
    <AuthContext.Provider value={auth}>
      <Routes>
        <Route path="/login" element={auth.user ? <Navigate to={auth.user.role === "DOCTOR" ? "/doctor" : "/lab"} /> : <Login />} />

        {/* Lab technician */}
        <Route path="/lab" element={<Guard role="LAB_TECHNICIAN"><Shell><LabDashboard /></Shell></Guard>} />
        <Route path="/lab/upload" element={<Guard role="LAB_TECHNICIAN"><Shell><UploadReport /></Shell></Guard>} />

        {/* Doctor */}
        <Route path="/doctor" element={<Guard role="DOCTOR"><Shell><DoctorDashboard /></Shell></Guard>} />
        <Route path="/doctor/reports" element={<Guard role="DOCTOR"><Shell><AssignedReports /></Shell></Guard>} />
        <Route path="/doctor/activity" element={<Guard role="DOCTOR"><Shell><MyActivity /></Shell></Guard>} />

        {/* Shared */}
        <Route path="/reports/:id" element={<Guard><Shell><ReportDetailPage /></Shell></Guard>} />
        <Route path="/analytics" element={<Guard><Shell><Analytics /></Shell></Guard>} />
        <Route path="/clinical" element={<Guard><Shell><ClinicalIntelligence /></Shell></Guard>} />
        <Route path="/security" element={<Guard><Shell><SecurityCompliance /></Shell></Guard>} />

        <Route path="*" element={<Navigate to={auth.user ? (auth.user.role === "DOCTOR" ? "/doctor" : "/lab") : "/login"} />} />
      </Routes>
    </AuthContext.Provider>
  );
}

function Guard({ role, children }: { role?: "DOCTOR" | "LAB_TECHNICIAN"; children: React.ReactNode }) {
  const auth = React.useContext(AuthContext);
  if (!auth?.user) return <Navigate to="/login" />;
  if (role && auth.user.role !== role) return <Navigate to={auth.user.role === "DOCTOR" ? "/doctor" : "/lab"} />;
  return <>{children}</>;
}
