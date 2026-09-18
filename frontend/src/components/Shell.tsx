import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Activity, Upload, Users, FileText, BarChart3, Search, Bell,
  LogOut, ShieldCheck, TrendingUp,
} from "lucide-react";
import { C, Card } from "./ui";
import { useAuth } from "../hooks/useAuth";
import { notificationsApi } from "../services/api";
import type { NotificationOut } from "../types";

export function Sidebar() {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const doctorItems = [
    { path: "/doctor", label: "Dashboard", icon: BarChart3 },
    { path: "/doctor/reports", label: "Assigned Reports", icon: FileText },
    { path: "/doctor/activity", label: "My Activity", icon: Users },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/clinical", label: "Clinical Intelligence", icon: TrendingUp },
    { path: "/security", label: "Security & Compliance", icon: ShieldCheck },
  ];
  const labItems = [
    { path: "/lab", label: "Dashboard", icon: BarChart3 },
    { path: "/lab/upload", label: "Upload Report", icon: Upload },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/clinical", label: "Clinical Intelligence", icon: TrendingUp },
    { path: "/security", label: "Security & Compliance", icon: ShieldCheck },
  ];
  const items = user?.role === "DOCTOR" ? doctorItems : labItems;

  return (
    <div className="hidden lg:flex flex-col w-60 shrink-0 h-[calc(100vh-64px)] sticky top-16 py-6 px-4" style={{ borderRight: `1px solid ${C.border}`, background: "white" }}>
      <div className="space-y-1">
        {items.map((it) => {
          const active = loc.pathname === it.path;
          return (
            <button
              key={it.path}
              onClick={() => nav(it.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: active ? "#EFF6FF" : "transparent", color: active ? C.primary : C.subtext }}
            >
              <it.icon size={17} />
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TopBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role !== "DOCTOR") return;
    const load = () => notificationsApi.list().then(setNotifications).catch(() => {});
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = notifications.filter((n) => !n.is_read).length;

  const openNotification = async (n: NotificationOut) => {
    await notificationsApi.markRead(n.id).catch(() => {});
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    setOpen(false);
    if (n.report_id) nav(`/reports/${n.report_id}`);
  };

  return (
    <div className="sticky top-0 z-30 h-16 flex items-center justify-between px-6" style={{ borderBottom: `1px solid ${C.border}`, background: "white" }}>
      <button onClick={() => nav(user?.role === "DOCTOR" ? "/doctor" : "/lab")} className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
          <Activity size={18} color="white" />
        </div>
        <span className="font-bold text-[15px] hidden sm:inline" style={{ color: C.text }}>LabTriage <span style={{ color: C.primary }}>AI</span></span>
      </button>

      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.subtext} />
          <input placeholder="Search patients, reportsâ€¦" className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none" style={{ border: `1px solid ${C.border}`, background: C.bg }} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user?.role === "DOCTOR" && (
          <div className="relative" ref={ref}>
            <button className="relative" onClick={() => setOpen((o) => !o)}>
              <Bell size={19} color={C.subtext} />
              {unread > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full" style={{ background: C.critical }} />}
            </button>
            {open && (
              <Card className="absolute right-0 mt-3 w-80 overflow-hidden z-40" style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}>
                <div className="px-4 py-3 font-semibold text-sm" style={{ borderBottom: `1px solid ${C.border}`, color: C.text }}>Notifications</div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && <div className="px-4 py-6 text-xs text-center" style={{ color: C.subtext }}>No notifications yet.</div>}
                  {notifications.map((n) => (
                    <button key={n.id} onClick={() => openNotification(n)} className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors" style={{ borderTop: `1px solid ${C.border}`, opacity: n.is_read ? 0.6 : 1 }}>
                      <div className="text-sm font-semibold" style={{ color: C.text }}>{n.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: C.subtext }}>{n.message}</div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: C.secondary }}>
            {user?.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-semibold" style={{ color: C.text }}>{user?.name}</div>
            <div className="text-[11px]" style={{ color: C.subtext }}>{user?.specialty || user?.role.replace("_", " ")}</div>
          </div>
          <button onClick={logout} title="Log out" className="ml-2">
            <LogOut size={16} color={C.subtext} />
          </button>
        </div>
      </div>
    </div>
  );
}
