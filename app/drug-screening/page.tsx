"use client";

import NextLink from "next/link";
import { useRef, useState } from "react";
import { ADMEResult, calculateLipinski, LipinskiResult, predictADME } from "@/lib/chemistry";

// ─── TOP LEVEL COMPONENTS (outside main page function to hold state/focus) ────

function DSCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-200 ${className}`}
      style={{
        background: "rgba(13,27,46,0.65)",
        border: "1px solid rgba(6,182,212,0.12)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
      }}
    >
      {children}
    </div>
  );
}

function DSCardHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b"
      style={{ background: "rgba(5,13,26,0.5)", borderColor: "rgba(6,182,212,0.12)" }}
    >
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-outfit)", color: "#e2e8f0" }}>
            {title}
          </h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{subtitle}</p>}
        </div>
      </div>
      {badge && <div>{badge}</div>}
    </div>
  );
}

function ADMEBadge({ level }: { level: "High" | "Moderate" | "Low" | "Good" | "Poor" }) {
  const isGood = level === "High" || level === "Good";
  const isMod = level === "Moderate";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        background: isGood ? "rgba(16,185,129,0.12)" : isMod ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
        color: isGood ? "#34d399" : isMod ? "#fbbf24" : "#f87171",
        border: `1px solid ${isGood ? "rgba(16,185,129,0.25)" : isMod ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      {level}
    </span>
  );
}

function CheckBadge({ pass }: { pass: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
      style={{
        background: pass ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
        color: pass ? "#34d399" : "#f87171",
        border: `1px solid ${pass ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      {pass ? "PASS" : "FAIL"}
    </span>
  );
}

const EXAMPLE_SMILES = [
  { name: "Aspirin", smiles: "CC(=O)Oc1ccccc1C(=O)O" },
  { name: "Caffeine", smiles: "Cn1cnc2c1c(=O)n(C)c(=O)n2C" },
  { name: "Ibuprofen", smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O" },
  { name: "Paracetamol", smiles: "CC(=O)Nc1ccc(O)cc1" },
];

export default function DrugScreeningPage() {
  const [smilesInput, setSmilesInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<{
    lipinski: LipinskiResult;
    adme: ADMEResult;
    smiles: string;
    imageUrl: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [showCalcDetails, setShowCalcDetails] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  function handleAnalyze() {
    const s = smilesInput.trim();
    if (!s) { setError("Please enter a SMILES string."); return; }
    setError("");
    setAnalyzing(true);
    setResults(null);

    setTimeout(() => {
      try {
        const lipinski = calculateLipinski(s);
        const adme = predictADME(lipinski);
        const imageUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(s)}/PNG?image_size=400x400`;
        setResults({ lipinski, adme, smiles: s, imageUrl });
        setAnalyzing(false);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      } catch {
        setError("Failed to parse SMILES. Please check the input and try again.");
        setAnalyzing(false);
      }
    }, 1200);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(5,13,26,0.6)",
    border: "1px solid rgba(6,182,212,0.18)",
    color: "#06b6d4",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    fontFamily: "monospace",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    resize: "none",
  };

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
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: "rgba(5,13,26,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(6,182,212,0.1)" }}>
        <NextLink href="/" className="flex items-center gap-2.5">
          <span className="text-lg font-black tracking-tight" style={{
            fontFamily: "var(--font-outfit)",
            background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>PatentPilot</span>
        </NextLink>
        <div className="flex items-center gap-2">
          <NextLink href="/" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ color: "#94a3b8", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            Patent Analysis
          </NextLink>
          <NextLink href="/history" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ color: "#94a3b8", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            History
          </NextLink>
        </div>
      </div>

      <main className="relative min-h-screen pt-20 pb-16 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">

          {/* Hero */}
          <div className="mb-8 pt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="h-px w-12" style={{ background: "rgba(16,185,129,0.5)" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#10b981" }}>Molecular Screening</span>
              <span className="h-px w-12" style={{ background: "rgba(16,185,129,0.5)" }} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
              <span style={{ color: "#e2e8f0" }}>Drug Screening </span>
              <span style={{ color: "#06b6d4" }}>Dashboard</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
              Compute molecular descriptors · Lipinski Rule of Five · ADME prediction
            </p>
          </div>

          {/* INPUT */}
          <DSCard className="mb-6">
            <DSCardHeader title="Molecular Input" />
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>
                  SMILES String <span style={{ color: "#06b6d4" }}>*</span>
                </label>
                <textarea
                  id="smiles-input"
                  value={smilesInput}
                  onChange={(e) => setSmilesInput(e.target.value)}
                  placeholder="Enter a SMILES string, e.g. CC(=O)Oc1ccccc1C(=O)O"
                  rows={2}
                  style={inputStyle as React.CSSProperties}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.07)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.18)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {/* Quick example chips */}
              <div>
                <p className="text-xs mb-2" style={{ color: "#475569" }}>Quick examples:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_SMILES.map((ex) => (
                    <button key={ex.name} onClick={() => { setSmilesInput(ex.smiles); setError(""); }}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                      style={{ background: "rgba(6,182,212,0.07)", color: "#94a3b8", border: "1px solid rgba(6,182,212,0.12)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#06b6d4"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.35)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.12)"; }}>
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all"
                  style={{
                    background: analyzing ? "rgba(6,182,212,0.2)" : "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                    color: analyzing ? "#64748b" : "#050d1a",
                    boxShadow: analyzing ? "none" : "0 4px 20px rgba(6,182,212,0.25)",
                    cursor: analyzing ? "not-allowed" : "pointer",
                  }}>
                  {analyzing ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Analyzing...</>
                  ) : "Analyze Molecule"}
                </button>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                  {error}
                </div>
              )}
            </div>
          </DSCard>

          {/* Loading */}
          {analyzing && (
            <DSCard className="mb-6">
              <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                <div className="h-16 w-16 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
                <div>
                  <p className="font-semibold" style={{ color: "#e2e8f0" }}>Analysing molecular structure...</p>
                  <p className="text-sm mt-1" style={{ color: "#64748b" }}>Computing descriptors, Lipinski properties, and ADME predictions</p>
                </div>
              </div>
            </DSCard>
          )}

          {/* RESULTS */}
          {results && (
            <div ref={resultsRef} className="space-y-6">

              {/* Structure + Descriptors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DSCard>
                  <DSCardHeader title="2D Molecular Structure" />
                  <div className="p-6 flex flex-col items-center">
                    <div className="rounded-xl p-4 bg-white mb-3" style={{ border: "2px solid rgba(6,182,212,0.2)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={results.imageUrl} alt="2D molecular structure" width={200} height={200} className="rounded"
                        onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>{results.lipinski.formula}</p>
                    <p className="text-xs mt-1" style={{ color: "#64748b" }}>MW: {results.lipinski.mw.toFixed(3)} g/mol</p>
                  </div>
                </DSCard>

                <DSCard>
                  <DSCardHeader title="Molecular Descriptors" />
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Mol. Formula", value: results.lipinski.formula },
                        { label: "Mol. Weight", value: `${results.lipinski.mw.toFixed(2)} g/mol` },
                        { label: "LogP", value: results.lipinski.logP.toFixed(2) },
                        { label: "H-Bond Donors", value: String(results.lipinski.hbd) },
                        { label: "H-Bond Acceptors", value: String(results.lipinski.hba) },
                        { label: "Rotatable Bonds", value: String(results.lipinski.rotBonds) },
                        { label: "TPSA", value: `${results.lipinski.tpsa} Å²` },
                        { label: "Aromatic Rings", value: String(results.lipinski.aromaticRings) },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl p-3" style={{ background: "rgba(5,13,26,0.5)", border: "1px solid rgba(6,182,212,0.08)" }}>
                          <p className="text-xs" style={{ color: "#64748b" }}>{item.label}</p>
                          <p className="font-bold text-sm mt-0.5" style={{ color: "#e2e8f0" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </DSCard>
              </div>

              {/* Lipinski */}
              <DSCard>
                <DSCardHeader title="Lipinski Rule of Five"
                  badge={
                    <span className="rounded-full px-4 py-1.5 text-sm font-bold" style={{
                      background: results.lipinski.pass ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: results.lipinski.pass ? "#34d399" : "#f87171",
                      border: `1px solid ${results.lipinski.pass ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}>
                      {results.lipinski.pass ? "PASS" : "FAIL"}
                    </span>
                  }
                />
                <div className="p-6 sm:p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(6,182,212,0.1)" }}>
                          {["Property", "Value", "Threshold", "Status"].map((h) => (
                            <th key={h} className="pb-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "#64748b" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Molecular Formula", value: results.lipinski.formula, threshold: "—", pass: true },
                          { label: "Molecular Weight", value: `${results.lipinski.mw.toFixed(2)} g/mol`, threshold: "≤ 500 g/mol", pass: results.lipinski.mwPass },
                          { label: "LogP (Lipophilicity)", value: results.lipinski.logP.toFixed(2), threshold: "≤ 5", pass: results.lipinski.logPPass },
                          { label: "H-Bond Donors", value: String(results.lipinski.hbd), threshold: "≤ 5", pass: results.lipinski.hbdPass },
                          { label: "H-Bond Acceptors", value: String(results.lipinski.hba), threshold: "≤ 10", pass: results.lipinski.hbaPass },
                          { label: "Rotatable Bonds", value: String(results.lipinski.rotBonds), threshold: "≤ 10 (preferred)", pass: results.lipinski.rotBonds <= 10 },
                          { label: "TPSA", value: `${results.lipinski.tpsa} Å²`, threshold: "≤ 140 Å²", pass: results.lipinski.tpsa <= 140 },
                        ].map((row) => (
                          <tr key={row.label} style={{ borderBottom: "1px solid rgba(6,182,212,0.06)" }}>
                            <td className="py-3 font-medium" style={{ color: "#94a3b8" }}>{row.label}</td>
                            <td className="py-3 font-bold font-mono" style={{ color: "#e2e8f0" }}>{row.value}</td>
                            <td className="py-3 text-xs" style={{ color: "#64748b" }}>{row.threshold}</td>
                            <td className="py-3"><CheckBadge pass={row.pass} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 rounded-xl px-5 py-4" style={{
                    background: results.lipinski.pass ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${results.lipinski.pass ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}>
                    <div>
                      <p className="font-bold text-sm" style={{ color: results.lipinski.pass ? "#34d399" : "#f87171" }}>
                        {results.lipinski.pass ? "PASS — Drug-like molecule" : `FAIL — ${results.lipinski.violations} Lipinski violation(s)`}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                        {results.lipinski.pass
                          ? "All Lipinski criteria satisfied. Suitable oral bioavailability expected."
                          : "One or more Lipinski rules violated. Oral bioavailability may be limited."}
                      </p>
                    </div>
                  </div>
                </div>
              </DSCard>

              {/* ADME */}
              <DSCard>
                <DSCardHeader title="ADME Prediction" />
                <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {[
                      { label: "Absorption", data: results.adme.absorption },
                      { label: "Distribution", data: results.adme.distribution },
                      { label: "Metabolism", data: results.adme.metabolism },
                      { label: "Excretion", data: results.adme.excretion },
                    ].map(({ label, data }) => (
                      <div key={label} className="rounded-xl p-5" style={{ background: "rgba(5,13,26,0.5)", border: "1px solid rgba(6,182,212,0.08)" }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{label}</span>
                          <ADMEBadge level={data.level} />
                        </div>
                        <p className="text-xs leading-5" style={{ color: "#64748b" }}>{data.explanation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl p-5" style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.12)" }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#06b6d4" }}>Pharmacokinetic Profile Summary</p>
                    <p className="text-sm leading-6" style={{ color: "#94a3b8" }}>{results.adme.summary}</p>
                  </div>
                </div>
              </DSCard>

              {/* Calculation Details */}
              <DSCard>
                <button className="w-full" onClick={() => setShowCalcDetails(!showCalcDetails)}>
                  <DSCardHeader title="Calculation Details"
                    badge={<span className="text-xs font-semibold" style={{ color: "#64748b" }}>{showCalcDetails ? "Collapse" : "Expand"}</span>}
                  />
                </button>

                {showCalcDetails && (
                  <div className="p-6 sm:p-8 space-y-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#06b6d4" }}>Molecular Weight Calculation</p>
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(6,182,212,0.08)" }}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ background: "rgba(5,13,26,0.6)" }}>
                              {["Element", "Count", "Atomic Weight (g/mol)", "Contribution (g/mol)"].map((h) => (
                                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {results.lipinski.elements.map((el, i) => (
                              <tr key={i} style={{ borderTop: "1px solid rgba(6,182,212,0.06)", background: i % 2 === 0 ? "rgba(5,13,26,0.2)" : "transparent" }}>
                                <td className="px-4 py-2.5 font-bold font-mono" style={{ color: "#06b6d4" }}>{el.symbol}</td>
                                <td className="px-4 py-2.5" style={{ color: "#e2e8f0" }}>{el.count}</td>
                                <td className="px-4 py-2.5 font-mono" style={{ color: "#94a3b8" }}>{el.atomicWeight.toFixed(3)}</td>
                                <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: "#e2e8f0" }}>{el.count} × {el.atomicWeight.toFixed(3)} = {el.mass.toFixed(3)}</td>
                              </tr>
                            ))}
                            <tr style={{ borderTop: "2px solid rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.05)" }}>
                              <td colSpan={3} className="px-4 py-3 font-bold text-sm" style={{ color: "#e2e8f0" }}>Total Molecular Weight</td>
                              <td className="px-4 py-3 font-bold font-mono text-base" style={{ color: "#06b6d4" }}>{results.lipinski.mw.toFixed(3)} g/mol</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl p-4" style={{ background: "rgba(5,13,26,0.4)", border: "1px solid rgba(6,182,212,0.08)" }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#06b6d4" }}>H-Bond Donors ({results.lipinski.hbd})</p>
                        <p className="text-xs leading-5" style={{ color: "#94a3b8" }}>
                          Counted by detecting NH and OH groups in the SMILES string. Threshold: ≤ 5.
                          Detected: {results.lipinski.hbd} donor(s).
                        </p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: "rgba(5,13,26,0.4)", border: "1px solid rgba(6,182,212,0.08)" }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#10b981" }}>H-Bond Acceptors ({results.lipinski.hba})</p>
                        <p className="text-xs leading-5" style={{ color: "#94a3b8" }}>
                          N + O atom count. N: {results.lipinski.elements.find(e => e.symbol === "N")?.count || 0}, O: {results.lipinski.elements.find(e => e.symbol === "O")?.count || 0}. Total: {results.lipinski.hba}. Threshold: ≤ 10.
                        </p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: "rgba(5,13,26,0.4)", border: "1px solid rgba(6,182,212,0.08)" }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#f59e0b" }}>Rotatable Bonds ({results.lipinski.rotBonds})</p>
                        <p className="text-xs leading-5" style={{ color: "#94a3b8" }}>
                          Estimated from chain structure: single bonds between non-terminal heavy atoms, excluding ring and amide bonds.
                        </p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: "rgba(5,13,26,0.4)", border: "1px solid rgba(6,182,212,0.08)" }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#8b5cf6" }}>TPSA ({results.lipinski.tpsa} Å²)</p>
                        <p className="text-xs leading-5" style={{ color: "#94a3b8" }}>
                          Ertl fragment method: OH +20.23, NH +17.59, C=O +17.07 Å² per group. Threshold: ≤ 140 Å².
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl p-4" style={{ background: "rgba(5,13,26,0.4)", border: "1px solid rgba(6,182,212,0.08)" }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#06b6d4" }}>LogP (Crippen–Wildman Method)</p>
                      <p className="text-xs leading-5" style={{ color: "#94a3b8" }}>
                        Fragment-based approach: each atom type contributes a fixed LogP value (aliphatic C: +0.144, aromatic C: +0.158, O: −0.217, N: −1.019, Cl: +0.724, Br: +0.753). Sum + size correction = <strong style={{ color: "#e2e8f0" }}>{results.lipinski.logP.toFixed(2)}</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </DSCard>

              {/* Overall Assessment */}
              {results.lipinski.pass ? (
                <div className="rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))", border: "2px solid rgba(16,185,129,0.3)", boxShadow: "0 0 40px rgba(16,185,129,0.08)" }}>
                  <div className="flex items-start gap-5">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-outfit)", color: "#34d399" }}>Suitable for Further Analysis</h3>
                      <p className="text-sm leading-6 mb-5" style={{ color: "#94a3b8" }}>
                        This molecule passes all Lipinski criteria and shows favourable predicted ADME properties, making it a strong candidate for further patent analysis.
                      </p>
                      <NextLink href={`/?smiles=${encodeURIComponent(results.smiles)}`}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
                        style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", color: "#050d1a", boxShadow: "0 4px 20px rgba(16,185,129,0.25)" }}>
                        Continue to Patent Analysis →
                      </NextLink>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(245,158,11,0.06)", border: "2px solid rgba(245,158,11,0.25)" }}>
                  <div className="flex items-start gap-5">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-outfit)", color: "#fbbf24" }}>Requires Structural Review</h3>
                      <p className="text-sm leading-6 mb-5" style={{ color: "#94a3b8" }}>
                        {results.lipinski.violations} Lipinski violation(s) detected. Consider structural modifications before patent analysis.
                      </p>
                      <NextLink href={`/?smiles=${encodeURIComponent(results.smiles)}`}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
                        style={{ color: "#fbbf24", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
                        Continue to Patent Analysis Anyway →
                      </NextLink>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl px-5 py-4 text-xs leading-6"
                style={{ background: "rgba(5,13,26,0.4)", border: "1px solid rgba(6,182,212,0.08)", color: "#475569" }}>
                <strong style={{ color: "#64748b" }}>Scientific Disclaimer:</strong> ADME results are computational predictions for early-stage research prioritisation and do not replace experimental PK studies. Lipinski rules are guidelines — exceptions exist for many successful drugs.
              </div>

            </div>
          )}

        </div>
      </main>
    </>
  );
}
