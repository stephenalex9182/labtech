// Shared design-system atoms — ported 1:1 from the existing approved UI.
// Do not change colors, spacing, or radii here; these values are the source
// of truth for the whole app's visual identity.
import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertOctagon, AlertTriangle, Gauge, CheckCircle2,
} from "lucide-react";
import type { Priority } from "../types";

export const C = {
  primary: "#2563EB",
  secondary: "#0F766E",
  bg: "#F8FAFC",
  border: "#E2E8F0",
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#D97706",
  normal: "#16A34A",
  text: "#0F172A",
  subtext: "#64748B",
};

export const PRIORITY_STYLES: Record<Priority, { color: string; bg: string; border: string; icon: LucideIcon }> = {
  CRITICAL: { color: C.critical, bg: "#FEF2F2", border: "#FECACA", icon: AlertOctagon },
  HIGH: { color: C.high, bg: "#FFF7ED", border: "#FED7AA", icon: AlertTriangle },
  MEDIUM: { color: C.medium, bg: "#FFFBEB", border: "#FDE68A", icon: Gauge },
  NORMAL: { color: C.normal, bg: "#F0FDF4", border: "#BBF7D0", icon: CheckCircle2 },
};

export function Badge({ priority, size = "md" }: { priority: Priority; size?: "md" | "lg" }) {
  const s = PRIORITY_STYLES[priority];
  const Icon = s.icon;
  const pad = size === "lg" ? "px-5 py-2 text-base" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad}`}
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      <Icon size={size === "lg" ? 18 : 13} />
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

export function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-xl bg-white ${className}`}
      style={{ border: `1px solid ${C.border}`, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 12px rgba(15,23,42,0.03)", ...style }}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({ children, onClick, className = "", type = "button", disabled = false }: {
  children: React.ReactNode; onClick?: () => void; className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${className}`}
      style={{ background: C.primary, boxShadow: "0 1px 2px rgba(37,99,235,0.15)" }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] ${className}`}
      style={{ color: C.text, border: `1px solid ${C.border}`, background: "white" }}
    >
      {children}
    </button>
  );
}

export function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: LucideIcon; color: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: color + "14" }}>
          <Icon size={18} color={color} />
        </div>
        <span className="h-2 w-2 rounded-full mt-2" style={{ background: color }} />
      </div>
      <div className="text-2xl font-bold" style={{ color: C.text }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: C.subtext }}>{label}</div>
    </Card>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg px-4 py-3 text-sm mb-4" style={{ background: "#FEF2F2", color: C.critical, border: "1px solid #FECACA" }}>
      {message}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-14">
      <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>{title}</div>
      <div className="text-xs" style={{ color: C.subtext }}>{description}</div>
    </div>
  );
}
