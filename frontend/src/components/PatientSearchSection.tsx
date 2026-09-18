import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserCheck, Calendar, FileText, ChevronRight, AlertCircle, X } from "lucide-react";
import { C, Card, Badge, PRIORITY_STYLES } from "./ui";
import { reportsApi } from "../services/api";
import type { PatientHistoryItem } from "../types";

export function PatientSearchSection() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PatientHistoryItem[] | null>(null);
  const [searched, setSearched] = useState(false);

  const performSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) {
      setResults(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await reportsApi.searchPatientHistory(q);
      setResults(data);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults(null);
        setSearched(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <Card className="p-6 mb-8 border-2 border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: C.text }}>
            <UserCheck size={18} className="text-blue-600" /> Patient History & Unique ID Search
          </h2>
          <p className="text-xs" style={{ color: C.subtext }}>
            Search by Unique Patient ID (e.g. <span className="font-mono font-semibold text-blue-600">PKRBTZ</span>, <span className="font-mono font-semibold text-blue-600">P61LPO</span>, <span className="font-mono font-semibold text-blue-600">PT0001</span>) to view history.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type Unique Patient ID (e.g. PKRBTZ, P61LPO, PT0001)..."
            className="w-full pl-10 pr-9 py-2.5 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow transition-colors disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {searched && (
        <div className="mt-6 space-y-4">
          {!results || results.length === 0 ? (
            <div className="p-4 bg-white rounded-lg border border-slate-200 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              No patient history found matching Unique ID "<span className="font-semibold text-slate-700">{query}</span>".
            </div>
          ) : (
            results.map((patient) => (
              <div key={patient.patient_id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-800 text-white flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base font-mono text-blue-300">
                        Patient Unique ID: #{patient.unique_id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      {patient.age} yrs · {patient.gender} · {patient.reports.length} Uploaded Report(s) in History
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {patient.reports.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">No lab report history for this patient.</div>
                  ) : (
                    patient.reports.map((rep) => {
                      const priority = rep.priority || "NORMAL";
                      const pstyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES.NORMAL;
                      return (
                        <div key={rep.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar size={14} className="text-blue-500" />
                              <span>{new Date(rep.created_at).toLocaleString()}</span>
                              <span>·</span>
                              <FileText size={14} className="text-slate-400" />
                              <span>{rep.file_name || `report_${rep.id}.pdf`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {rep.priority && <Badge priority={rep.priority} />}
                              {rep.risk_score !== null && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: pstyle.bg, color: pstyle.color }}>
                                  Score: {rep.risk_score}/100
                                </span>
                              )}
                              <button
                                onClick={() => nav(`/reports/${rep.id}`)}
                                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5 ml-2"
                              >
                                View Details <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>

                          {rep.ai_summary && (
                            <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-700 mb-2">
                              <span className="font-semibold text-slate-900">AI PDF Summary: </span>
                              {rep.ai_summary}
                            </div>
                          )}

                          {rep.lab_results && rep.lab_results.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {rep.lab_results.map((lr) => (
                                <span
                                  key={lr.test_name}
                                  className={`text-[11px] px-2 py-1 rounded border font-medium ${
                                    lr.severity === "CRITICAL"
                                      ? "bg-red-50 text-red-700 border-red-200 font-bold"
                                      : lr.severity === "HIGH"
                                      ? "bg-amber-50 text-amber-700 border-amber-200 font-bold"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {lr.test_name}: {lr.value} {lr.unit || ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
