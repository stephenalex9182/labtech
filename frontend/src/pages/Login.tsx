import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ShieldCheck } from "lucide-react";
import { C, Card, PrimaryButton, ErrorBanner } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("anjali.menon@labtriage.demo");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("google_token");
    if (token) { localStorage.setItem("labtriage_token", token); window.location.assign("/"); }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      nav(user.role === "DOCTOR" ? "/doctor" : "/lab");
    } catch (err: any) {
      setError(err?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bg }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
            <Activity size={19} color="white" />
          </div>
          <span className="font-bold text-lg" style={{ color: C.text }}>LabTriage <span style={{ color: C.primary }}>AI</span></span>
        </div>

        <Card className="p-7">
          <h1 className="text-lg font-bold mb-1" style={{ color: C.text }}>Sign in</h1>
          <p className="text-xs mb-6" style={{ color: C.subtext }}>Lab technician and doctor accounts use the same login.</p>

          <ErrorBanner message={error} />
          <button type="button" onClick={() => window.location.assign("/api/auth/google/login")} className="w-full mb-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${C.border}`, color: C.text, background: "white" }}>Continue with Google</button>
          <div className="flex items-center gap-3 mb-4"><div className="flex-1" style={{borderTop:`1px solid ${C.border}`}} /><span className="text-[10px]" style={{color:C.subtext}}>OR</span><div className="flex-1" style={{borderTop:`1px solid ${C.border}`}} /></div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.text }}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${C.border}`, background: C.bg }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.text }}>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${C.border}`, background: C.bg }}
              />
            </div>
            <PrimaryButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing inâ€¦" : "Sign in"}
            </PrimaryButton>
          </form>
        </Card>

        <div className="mt-5 flex items-start gap-2 px-1">
          <ShieldCheck size={14} color={C.subtext} className="mt-0.5 shrink-0" />
          <div className="text-[11px] leading-relaxed w-full" style={{ color: C.subtext }}>
            <div className="mb-2"><strong>Quick Demo Logins (Password: <code>demo1234</code>)</strong></div>
            
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Doctor:</div>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {[
                { label: "Dr. Anjali Menon", email: "anjali.menon@labtriage.demo" },
                { label: "Dr. Sameer Iyer", email: "sameer.iyer@labtriage.demo" },
                { label: "Dr. Karthik Rao", email: "karthik.rao@labtriage.demo" },
                { label: "Dr. Neha Sharma", email: "neha.sharma@labtriage.demo" },
                { label: "Dr. Amit Patel", email: "amit.patel@labtriage.demo" },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword("demo1234"); }}
                  className="px-2 py-1 rounded text-[11px] font-medium border hover:bg-slate-100 transition-colors"
                  style={{ background: email === d.email ? "#EFF6FF" : "white", borderColor: email === d.email ? C.primary : C.border, color: email === d.email ? C.primary : C.text }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Lab Technician:</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Meera Nair", email: "meera.nair@labtriage.demo" },
                { label: "Vikram Das", email: "vikram.das@labtriage.demo" },
                { label: "Rohan Verma", email: "rohan.verma@labtriage.demo" },
                { label: "Sneha Gupta", email: "sneha.gupta@labtriage.demo" },
              ].map((t) => (
                <button
                  key={t.email}
                  type="button"
                  onClick={() => { setEmail(t.email); setPassword("demo1234"); }}
                  className="px-2 py-1 rounded text-[11px] font-medium border hover:bg-slate-100 transition-colors"
                  style={{ background: email === t.email ? "#EFF6FF" : "white", borderColor: email === t.email ? C.primary : C.border, color: email === t.email ? C.primary : C.text }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
