"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

/* ── Benzene ring 3D-style SVG molecule ── */
function MoleculeHero() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none">
      {/* Glow layers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[420px] h-[420px] rounded-full blur-3xl pulse-glow" style={{ background: "rgba(6,182,212,0.07)" }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[220px] h-[220px] rounded-full blur-2xl pulse-glow" style={{ background: "rgba(139,92,246,0.05)", animationDelay: "1.5s" }} />
      </div>

      {/* Main structure: Ibuprofen-like molecule */}
      <div className="float-anim relative z-10">
        <svg viewBox="0 0 500 480" width="420" height="400" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
          <defs>
            <radialGradient id="atomGlow1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="atomGlow2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="atomGlow3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── Benzene ring (center) ── */}
          {/* Hexagon vertices at center ~(250, 220), radius 70 */}
          {/* Ring bonds */}
          <line x1="250" y1="150" x2="311" y2="185" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.7" filter="url(#glow)" />
          <line x1="311" y1="185" x2="311" y2="255" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.7" filter="url(#glow)" />
          <line x1="311" y1="255" x2="250" y2="290" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.7" filter="url(#glow)" />
          <line x1="250" y1="290" x2="189" y2="255" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.7" filter="url(#glow)" />
          <line x1="189" y1="255" x2="189" y2="185" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.7" filter="url(#glow)" />
          <line x1="189" y1="185" x2="250" y2="150" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.7" filter="url(#glow)" />

          {/* Aromatic inner ring (dashed) */}
          <circle cx="250" cy="220" r="38" fill="none" stroke="#06b6d4" strokeWidth="1.2" strokeOpacity="0.35" strokeDasharray="5 4" />

          {/* ── Side chains ── */}
          {/* Left chain: isobutyl */}
          <line x1="189" y1="185" x2="128" y2="150" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
          <line x1="128" y1="150" x2="80" y2="175" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.5" />
          <line x1="128" y1="150" x2="110" y2="100" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.5" />

          {/* Right chain: propionic acid */}
          <line x1="311" y1="185" x2="372" y2="150" stroke="#10b981" strokeWidth="2" strokeOpacity="0.6" />
          <line x1="372" y1="150" x2="420" y2="175" stroke="#10b981" strokeWidth="2" strokeOpacity="0.6" />
          {/* C=O double bond */}
          <line x1="420" y1="175" x2="455" y2="145" stroke="#10b981" strokeWidth="2.5" strokeOpacity="0.7" />
          <line x1="422" y1="178" x2="457" y2="148" stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" />
          {/* O-H */}
          <line x1="420" y1="175" x2="440" y2="215" stroke="#10b981" strokeWidth="2" strokeOpacity="0.6" />

          {/* Bottom chain: methyl */}
          <line x1="250" y1="290" x2="250" y2="350" stroke="#8b5cf6" strokeWidth="2" strokeOpacity="0.6" />
          <line x1="250" y1="350" x2="210" y2="390" stroke="#8b5cf6" strokeWidth="1.8" strokeOpacity="0.5" />
          <line x1="250" y1="350" x2="290" y2="390" stroke="#8b5cf6" strokeWidth="1.8" strokeOpacity="0.5" />

          {/* ── Atom glows ── */}
          <circle cx="250" cy="220" r="45" fill="url(#atomGlow1)" opacity="0.5" />
          <circle cx="420" cy="175" r="30" fill="url(#atomGlow2)" opacity="0.6" />
          <circle cx="250" cy="350" r="25" fill="url(#atomGlow3)" opacity="0.5" />

          {/* ── Atom circles: benzene ring ── */}
          {[
            [250, 150], [311, 185], [311, 255], [250, 290], [189, 255], [189, 185]
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="18" fill="#0a1628" stroke="#06b6d4" strokeWidth="1.8" />
              <text x={cx} y={cy + 5} textAnchor="middle" fill="#06b6d4" fontSize="12" fontFamily="monospace" fontWeight="bold">C</text>
            </g>
          ))}

          {/* Central ring label */}
          <circle cx="250" cy="220" r="22" fill="#0a1628" stroke="#06b6d4" strokeWidth="2" />
          <text x="250" y="225" textAnchor="middle" fill="#06b6d4" fontSize="13" fontFamily="monospace" fontWeight="bold">φ</text>

          {/* Left chain atoms */}
          <circle cx="128" cy="150" r="18" fill="#0a1628" stroke="#0ea5e9" strokeWidth="1.8" />
          <text x="128" y="155" textAnchor="middle" fill="#0ea5e9" fontSize="12" fontFamily="monospace" fontWeight="bold">C</text>
          <circle cx="80" cy="175" r="14" fill="#0a1628" stroke="#0ea5e9" strokeWidth="1.5" />
          <text x="80" y="180" textAnchor="middle" fill="#0ea5e9" fontSize="11" fontFamily="monospace">CH₃</text>
          <circle cx="110" cy="100" r="14" fill="#0a1628" stroke="#0ea5e9" strokeWidth="1.5" />
          <text x="110" y="105" textAnchor="middle" fill="#0ea5e9" fontSize="11" fontFamily="monospace">CH₃</text>

          {/* Right chain atoms */}
          <circle cx="372" cy="150" r="18" fill="#0a1628" stroke="#10b981" strokeWidth="1.8" />
          <text x="372" y="155" textAnchor="middle" fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="bold">C</text>
          <circle cx="420" cy="175" r="18" fill="#0a1628" stroke="#10b981" strokeWidth="2" />
          <text x="420" y="180" textAnchor="middle" fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="bold">C</text>
          <circle cx="455" cy="145" r="14" fill="#0a1628" stroke="#10b981" strokeWidth="1.8" />
          <text x="455" y="150" textAnchor="middle" fill="#10b981" fontSize="11" fontFamily="monospace">O</text>
          <circle cx="440" cy="215" r="14" fill="#0a1628" stroke="#10b981" strokeWidth="1.8" />
          <text x="440" y="220" textAnchor="middle" fill="#10b981" fontSize="11" fontFamily="monospace">OH</text>

          {/* Bottom chain atoms */}
          <circle cx="250" cy="350" r="18" fill="#0a1628" stroke="#8b5cf6" strokeWidth="1.8" />
          <text x="250" y="355" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontFamily="monospace" fontWeight="bold">C</text>
          <circle cx="210" cy="390" r="14" fill="#0a1628" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="210" y="395" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontFamily="monospace">CH₃</text>
          <circle cx="290" cy="390" r="14" fill="#0a1628" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="290" y="395" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontFamily="monospace">CH₃</text>

          {/* Floating formula label */}
          <text x="250" y="440" textAnchor="middle" fill="#475569" fontSize="11" fontFamily="monospace">C₁₃H₁₈O₂ · Ibuprofen</text>

          {/* Orbit rings */}
          <ellipse cx="250" cy="220" rx="160" ry="55" fill="none" stroke="#06b6d4" strokeWidth="0.7" strokeOpacity="0.12" strokeDasharray="4 7" transform="rotate(-20 250 220)" />
          <ellipse cx="250" cy="220" rx="160" ry="55" fill="none" stroke="#8b5cf6" strokeWidth="0.7" strokeOpacity="0.1" strokeDasharray="4 7" transform="rotate(70 250 220)" />
        </svg>
      </div>

      {/* Floating particles */}
      {[
        { top: "12%", left: "8%", color: "#06b6d4", delay: "0s", s: 4 },
        { top: "22%", left: "88%", color: "#10b981", delay: "0.9s", s: 3 },
        { top: "72%", left: "6%", color: "#8b5cf6", delay: "1.8s", s: 3 },
        { top: "82%", left: "82%", color: "#06b6d4", delay: "2.7s", s: 4 },
        { top: "48%", left: "94%", color: "#f59e0b", delay: "3.6s", s: 3 },
        { top: "62%", left: "12%", color: "#0ea5e9", delay: "1.2s", s: 2 },
        { top: "35%", left: "92%", color: "#8b5cf6", delay: "2.1s", s: 2 },
      ].map((p, i) => (
        <div key={i} className="absolute rounded-full pulse-glow" style={{
          top: p.top, left: p.left,
          width: p.s * 2, height: p.s * 2,
          background: p.color,
          boxShadow: `0 0 ${p.s * 4}px ${p.color}`,
          animationDelay: p.delay,
        }} />
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/");
    });
  }, [router]);

  function validateEmail(val: string) {
    if (!val.endsWith("@vnrvjiet.in")) {
      return "Only @vnrvjiet.in email addresses are allowed.";
    }
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.replace("/");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
      setGoogleLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(5,13,26,0.6)",
    border: "1px solid rgba(6,182,212,0.18)",
    color: "#e2e8f0",
    width: "100%",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <main className="min-h-screen flex" style={{ background: "#050d1a" }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-between py-14 px-12 overflow-hidden">

        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.8) 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
        }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#050d1a] via-transparent to-[#050d1a] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050d1a] to-transparent pointer-events-none" />

        {/* Top logo area — large wordmark */}
        <div className="relative z-10 self-start">
          <div className="flex flex-col gap-1">
            <span
              className="text-4xl font-black tracking-tighter leading-none"
              style={{
                fontFamily: "var(--font-outfit)",
                background: "linear-gradient(135deg, #e2e8f0 30%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              PatentPilot
            </span>
            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "rgba(6,182,212,0.7)" }}
            >
              AI Patent Intelligence
            </span>
          </div>
        </div>

        {/* Molecule hero */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
          <MoleculeHero />
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 text-center space-y-3">
          <p
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-outfit)", color: "#e2e8f0" }}
          >
            Analyse · Discover · Protect
          </p>
          <p className="text-sm max-w-xs mx-auto" style={{ color: "#475569" }}>
            Search global pharmaceutical patents, screen drug candidates, and generate comprehensive patentability reports — powered by AI.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {["SMILES Analysis", "Patent Search", "AI Ranking", "ADME Screening"].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full text-xs font-medium" style={{
                background: "rgba(6,182,212,0.08)",
                color: "#06b6d4",
                border: "1px solid rgba(6,182,212,0.18)",
              }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">

          {/* Mobile wordmark */}
          <div className="lg:hidden mb-8">
            <span className="text-2xl font-black tracking-tighter" style={{
              fontFamily: "var(--font-outfit)",
              background: "linear-gradient(135deg, #e2e8f0 30%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              PatentPilot
            </span>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8" style={{
            background: "rgba(13,27,46,0.85)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(6,182,212,0.15)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.55), 0 0 48px rgba(6,182,212,0.04)",
          }}>

            {/* Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)", color: "#e2e8f0" }}>
                {mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#475569" }}>
                {mode === "login"
                  ? "Sign in with your @vnrvjiet.in email"
                  : "Register with your @vnrvjiet.in email"}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-xl p-1 mb-6" style={{
              background: "rgba(5,13,26,0.7)",
              border: "1px solid rgba(6,182,212,0.1)",
            }}>
              {(["login", "signup"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{
                    background: mode === m ? "rgba(6,182,212,0.15)" : "transparent",
                    color: mode === m ? "#06b6d4" : "#475569",
                    border: mode === m ? "1px solid rgba(6,182,212,0.25)" : "1px solid transparent",
                  }}>
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Google */}
            <button onClick={handleGoogle} disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mb-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            >
              {googleLoading
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                : <GoogleIcon />}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "rgba(6,182,212,0.1)" }} />
              <span className="text-xs" style={{ color: "#1e293b" }}>or with email</span>
              <div className="flex-1 h-px" style={{ background: "rgba(6,182,212,0.1)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@vnrvjiet.in"
                  required
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.55)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.18)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <p className="mt-1 text-xs" style={{ color: "#1e293b" }}>Only @vnrvjiet.in addresses accepted</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.55)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.18)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.55)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.08)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.18)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              )}

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}>
                  {success}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 mt-1"
                style={{
                  background: loading ? "rgba(6,182,212,0.2)" : "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                  color: loading ? "#475569" : "#050d1a",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(6,182,212,0.28)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (mode === "login" ? "Sign In" : "Create Account")}
              </button>
            </form>

            <p className="mt-5 text-center text-xs" style={{ color: "#1e293b" }}>
              {mode === "login" ? (
                <>No account?{" "}
                  <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                    className="font-semibold" style={{ color: "#06b6d4" }}>Sign up free</button></>
              ) : (
                <>Already registered?{" "}
                  <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                    className="font-semibold" style={{ color: "#06b6d4" }}>Sign in</button></>
              )}
            </p>
          </div>

          <p className="mt-5 text-center text-xs" style={{ color: "#0f172a" }}>
            For VNR VJIET students and faculty only.
          </p>
        </div>
      </div>
    </main>
  );
}
