"use client";

type Props = {
  active: boolean;
  label?: string;
};

export default function ProcessingOverlay({ active, label = "Processing…" }: Props) {
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {/* Morphing rings */}
      <div style={{ position: "relative", width: 88, height: 88, marginBottom: 24 }}>
        {/* Outer ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "3px solid rgba(239,68,68,0.15)",
          animation: "po-spin-slow 3s linear infinite",
        }}/>
        {/* Middle ring with dash */}
        <div style={{
          position: "absolute", inset: 8, borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "#ef4444",
          borderRightColor: "rgba(239,68,68,0.4)",
          animation: "po-spin 1.1s cubic-bezier(0.6,0.2,0.4,0.8) infinite",
        }}/>
        {/* Inner ring reverse */}
        <div style={{
          position: "absolute", inset: 18, borderRadius: "50%",
          border: "2px solid transparent",
          borderBottomColor: "#ef4444",
          borderLeftColor: "rgba(239,68,68,0.3)",
          animation: "po-spin-rev 0.8s linear infinite",
        }}/>
        {/* Center dot */}
        <div style={{
          position: "absolute", inset: 30, borderRadius: "50%",
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          animation: "po-pulse 1.1s ease-in-out infinite",
          boxShadow: "0 0 16px rgba(239,68,68,0.5)",
        }}/>
      </div>

      {/* Label */}
      <p style={{
        fontSize: 15, fontWeight: 600, color: "#0f172a",
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
        marginBottom: 6,
        animation: "po-fade-in 0.3s ease",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 12, color: "#94a3b8",
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
        animation: "po-fade-in 0.5s ease",
      }}>
        Running in your browser — no uploads
      </p>

      {/* Progress bar */}
      <div style={{
        marginTop: 20, width: 160, height: 3, borderRadius: 99,
        background: "rgba(239,68,68,0.12)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: "linear-gradient(90deg, #ef4444, #f97316)",
          animation: "po-bar 1.6s ease-in-out infinite",
        }}/>
      </div>

      <style>{`
        @keyframes po-spin      { to { transform: rotate(360deg); } }
        @keyframes po-spin-slow { to { transform: rotate(360deg); } }
        @keyframes po-spin-rev  { to { transform: rotate(-360deg); } }
        @keyframes po-pulse {
          0%, 100% { transform: scale(0.85); opacity: 0.7; }
          50%       { transform: scale(1.1);  opacity: 1;   }
        }
        @keyframes po-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(60%);  }
          100% { transform: translateX(200%); }
        }
        @keyframes po-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
