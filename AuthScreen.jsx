import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

      } else if (mode === "signup") {
        if (!displayName.trim()) throw new Error("Please enter your name.");
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) throw error;

        // Create profile row
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            display_name: displayName.trim(),
            email: email.toLowerCase(),
            created_at: new Date().toISOString(),
          });
        }

        setSuccess("Check your email to confirm your account, then sign in.");
        setMode("login");

      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: "https://bookworm-dpq.pages.dev",
        });
        if (error) throw error;
        setSuccess("Password reset link sent — check your email.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1.5px solid var(--surface, #EDE8DF)",
    background: "var(--surface, #EDE8DF)",
    fontSize: 16,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: "var(--ink, #2C2416)",
    outline: "none",
    boxSizing: "border-box",
    WebkitAppearance: "none",
    transition: "border-color 0.15s ease",
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg, #F5F0E8)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 24px env(safe-area-inset-bottom, 24px)",
    }}>

      {/* Logo mark */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "var(--accent, #E07C3A)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          boxShadow: "0 4px 20px rgba(224,124,58,0.3)",
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <div style={{
          fontSize: 26, fontWeight: 700,
          fontFamily: "'Lora', Georgia, serif",
          color: "var(--ink, #2C2416)",
          letterSpacing: "-0.02em",
        }}>
          BookWorm
        </div>
        <div style={{
          fontSize: 13, color: "var(--ink-faded, #7A6E5F)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          marginTop: 4, letterSpacing: "0.01em",
        }}>
          {mode === "login" ? "Welcome back" : mode === "signup" ? "Start reading" : "Reset your password"}
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "var(--surface, #EDE8DF)",
        borderRadius: 20, padding: "28px 24px 24px",
        boxShadow: "0 2px 24px rgba(44,36,22,0.08)",
      }}>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your name"
              autoComplete="name"
              style={inputStyle}
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            style={inputStyle}
          />
          {mode !== "forgot" && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              style={inputStyle}
            />
          )}
        </div>

        {/* Error / success */}
        {error && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: "rgba(192,96,42,0.10)",
            fontSize: 13, color: "#C0602A",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            lineHeight: 1.45,
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: "rgba(74,107,92,0.12)",
            fontSize: 13, color: "#2C6B4A",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            lineHeight: 1.45,
          }}>
            {success}
          </div>
        )}

        {/* Primary button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", marginTop: 16,
            padding: "15px 0", borderRadius: 12, border: "none",
            background: loading ? "var(--ink-faded, #7A6E5F)" : "var(--accent, #E07C3A)",
            color: "#fff", fontSize: 16, fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            cursor: loading ? "default" : "pointer",
            transition: "background 0.15s ease",
            WebkitTapHighlightColor: "transparent",
            letterSpacing: "0.01em",
          }}
        >
          {loading
            ? "…"
            : mode === "login"
            ? "Sign in"
            : mode === "signup"
            ? "Create account"
            : "Send reset link"}
        </button>

        {/* Forgot password — login mode only */}
        {mode === "login" && (
          <button
            onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
            style={{
              width: "100%", marginTop: 10, padding: "8px 0",
              background: "none", border: "none",
              fontSize: 13, color: "var(--ink-faded, #7A6E5F)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}
          >
            Forgot password?
          </button>
        )}
      </div>

      {/* Mode switcher */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        {mode === "login" && (
          <span style={{ fontSize: 14, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            No account?{" "}
            <button onClick={() => { setMode("signup"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", padding: 0, fontSize: 14, fontWeight: 600, color: "var(--accent, #E07C3A)", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif", WebkitTapHighlightColor: "transparent" }}>
              Create one
            </button>
          </span>
        )}
        {(mode === "signup" || mode === "forgot") && (
          <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", padding: 0, fontSize: 14, color: "var(--ink-faded, #7A6E5F)", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif", WebkitTapHighlightColor: "transparent" }}>
            ← Back to sign in
          </button>
        )}
      </div>

      {/* Tagline */}
      <p style={{
        marginTop: 40, fontSize: 12,
        color: "var(--ink-faded, #7A6E5F)",
        fontFamily: "'Lora', Georgia, serif",
        fontStyle: "italic", textAlign: "center", letterSpacing: "0.01em",
      }}>
        Free books. A reader worth keeping.
      </p>
    </div>
  );
}
