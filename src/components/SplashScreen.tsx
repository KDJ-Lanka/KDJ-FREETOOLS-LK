"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");

    if (sessionStorage.getItem("ft-splash-shown")) {
      setPhase("gone");
      return;
    }
    sessionStorage.setItem("ft-splash-shown", "1");

    const fadeTimer = setTimeout(() => setPhase("fading"), 1600);
    const goneTimer = setTimeout(() => setPhase("gone"), 2200);
    return () => { clearTimeout(fadeTimer); clearTimeout(goneTimer); };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "#000" : "#fff",
        transition: "opacity 0.55s ease",
        opacity: phase === "fading" ? 0 : 1,
        pointerEvents: phase === "fading" ? "none" : "all",
      }}
    >
      {/* Logo mark */}
      <div style={{ position: "relative", marginBottom: "18px" }}>
        <img
          src="/icon.png"
          alt="FreeTools.lk"
          style={{ width: 72, height: 72, borderRadius: 18, objectFit: "contain" }}
        />
      </div>

      {/* Wordmark */}
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px",
          color: isDark ? "#f1f5f9" : "#0f172a", lineHeight: 1,
          fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
        }}>
          FreeTools<span style={{ color: "#ef4444" }}>.lk</span>
        </p>
        <p style={{
          marginTop: 6, fontSize: 13, color: "#94a3b8",
          fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
          letterSpacing: "0.02em",
        }}>
          Simple tools for everyone
        </p>
      </div>

      {/* Loading dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 32 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#ef4444",
            animation: `splash-dot 0.9s ${i * 0.18}s ease-in-out infinite`,
          }}/>
        ))}
      </div>

      <style>{`
        @keyframes splash-ring {
          0%   { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes splash-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
          40%            { transform: scale(1);   opacity: 1;    }
        }
      `}</style>
    </div>
  );
}
