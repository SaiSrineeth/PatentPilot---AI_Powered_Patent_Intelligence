"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";

interface Analysis {
  id: number;
  smiles: string;
  target: string;
  disease: string;
  compound_name: string;
  recommendation: string;
  risk_score: number;
  created_at: string;
}

function riskStyle(raw?: string) {
  const value = (raw || "").toLowerCase();
  if (value.includes("low")) return { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.25)", dot: "#10b981", bar: "#10b981" };
  if (value.includes("high")) return { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.25)", dot: "#ef4444", bar: "#ef4444" };
  if (value.includes("medium") || value.includes("moderate") || value.includes("expert") || value.includes("review")) {
    return { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", dot: "#f59e0b", bar: "#f59e0b" };
  }
  return { bg: "rgba(100,116,139,0.1)", text: "#94a3b8", border: "rgba(100,116,139,0.2)", dot: "#64748b", bar: "#64748b" };
}

function RiskBadge({ value }: { value: string }) {
  const s = riskStyle(value);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {value || "Pending"}
    </span>
  );
}

function HistoryContent() {
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const searchParams = useSearchParams();

  useEffect(() => {
    const value = searchParams.get("search") ?? "";
    setSearchTerm(value);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => { setHistory(d); setLoading(false); });
  }, []);

  const filteredHistory = useMemo(() =>
    [...history]
      .filter((item) => {
        const q = searchTerm.trim().toLowerCase();
        return item.compound_name?.toLowerCase().includes(q) || item.smiles?.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === "highest") return b.risk_score - a.risk_score;
        if (sortBy === "lowest") return a.risk_score - b.risk_score;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [history, searchTerm, sortBy]
  );

  return (
    <>
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-6 pb-8 mb-8"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.1)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-8" style={{ background: "rgba(6,182,212,0.4)" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#06b6d4" }}>Research Archive</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "var(--font-outfit)", color: "#e2e8f0" }}>
            Analysis History
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            {filteredHistory.length > 0
              ? `${filteredHistory.length} compound${filteredHistory.length === 1 ? "" : "s"} found`
              : "Your past compound analyses will appear here"}
          </p>
        </div>
        <NextLink
          href="/"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
          style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}
        >
          ← Back to Analysis
        </NextLink>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <input
          type="text"
          placeholder="Search by compound name or SMILES..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-[400px] rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: "rgba(5,13,26,0.6)",
            border: "1px solid rgba(6,182,212,0.15)",
            color: "#e2e8f0",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.15)"; }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: "rgba(5,13,26,0.6)",
            border: "1px solid rgba(6,182,212,0.15)",
            color: "#94a3b8",
          }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Score</option>
          <option value="lowest">Lowest Score</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[260px] animate-pulse rounded-2xl" style={{ background: "rgba(13,27,46,0.5)", border: "1px solid rgba(6,182,212,0.06)" }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredHistory.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-24 text-center"
          style={{ border: "1px dashed rgba(6,182,212,0.15)", background: "rgba(13,27,46,0.3)" }}
        >
          <p className="font-semibold text-lg" style={{ color: "#64748b" }}>No analyses found</p>
          <p className="mt-1 text-sm" style={{ color: "#374151" }}>
            {searchTerm ? "Try a different search term." : "Run your first compound analysis to see it here."}
          </p>
          <NextLink
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
            style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            Start New Analysis →
          </NextLink>
        </div>
      )}

      {/* Cards */}
      {!loading && history.length > 0 && (
        <div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(6,182,212,0.5)" }}>
            Analysis Records
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredHistory.map((item) => {
              const s = riskStyle(item.recommendation);
              const score = Math.max(0, Math.min(100, item.risk_score ?? 0));
              return (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl transition-all duration-200"
                  style={{ background: "rgba(13,27,46,0.65)", border: "1px solid rgba(6,182,212,0.1)", backdropFilter: "blur(12px)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.1)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <h2 className="text-base font-bold leading-tight capitalize" style={{ color: "#e2e8f0" }}>
                        {item.compound_name || "Unnamed Compound"}
                      </h2>
                      <RiskBadge value={item.recommendation} />
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      {[
                        { label: "Target", value: item.target },
                        { label: "Disease", value: item.disease },
                        { label: "Date", value: new Date(item.created_at).toLocaleDateString() },
                      ].map((row) => (
                        <div key={row.label} className="flex items-baseline justify-between gap-4">
                          <span style={{ color: "#64748b" }}>{row.label}</span>
                          <span className="font-medium text-right truncate" style={{ color: "#94a3b8" }}>{row.value || "—"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Score bar */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span style={{ color: "#64748b" }}>Overall Score</span>
                        <span className="font-bold tabular-nums" style={{ color: "#e2e8f0" }}>
                          {score}<span style={{ color: "#374151" }}>/100</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="h-full rounded-full" style={{ width: `${score}%`, background: s.bar, boxShadow: `0 0 6px ${s.bar}66` }} />
                      </div>
                    </div>
                  </div>

                  {/* Footer link */}
                  <NextLink
                    href={`/history/${item.id}`}
                    className="group flex items-center justify-between px-5 py-4 transition-all"
                    style={{ borderTop: "1px solid rgba(6,182,212,0.08)", background: "rgba(5,13,26,0.3)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(6,182,212,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(5,13,26,0.3)"; }}
                  >
                    <span className="text-sm font-semibold" style={{ color: "#64748b" }}>Explore details</span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-transform group-hover:translate-x-0.5"
                      style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}
                    >
                      →
                    </span>
                  </NextLink>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default function HistoryPage() {
  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "#050d1a" }}>
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />
      </div>

      {/* Nav */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: "rgba(5,13,26,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(6,182,212,0.1)" }}
      >
        <NextLink href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "linear-gradient(135deg, #06b6d4, #0ea5e9)", color: "#050d1a" }}>PP</div>
          <span className="text-base font-bold" style={{ fontFamily: "var(--font-outfit)", color: "#e2e8f0" }}>PatentPilot</span>
        </NextLink>
        <div className="flex items-center gap-2">
          <NextLink href="/drug-screening" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: "#06b6d4", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
            Drug Screening
          </NextLink>
          <NextLink href="/" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: "#94a3b8", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            New Analysis
          </NextLink>
        </div>
      </div>

      <main className="relative min-h-screen pt-20 pb-16 px-4 sm:px-8">
        <div className="mx-auto max-w-6xl pt-8">
          <Suspense fallback={<div style={{ color: "#64748b" }}>Loading...</div>}>
            <HistoryContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}