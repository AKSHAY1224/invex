import React, { useEffect, useState, useCallback } from "react";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Stages shown to the user during wake-up
const STAGES = [
  { label: "Contacting server…",        icon: "bi-wifi",              pct: 10 },
  { label: "Server is starting up…",    icon: "bi-hourglass-split",   pct: 35 },
  { label: "Loading services…",         icon: "bi-gear-wide-connected",pct: 60 },
  { label: "Almost ready…",             icon: "bi-lightning-charge",  pct: 85 },
  { label: "Finishing up…",             icon: "bi-check2-circle",     pct: 96 },
];

function useElapsed(running) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return elapsed;
}

function formatElapsed(s) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/**
 * Wraps your app. While the backend is cold-starting it shows a friendly
 * "waking up" screen and polls /health (or a fallback endpoint) with
 * exponential back-off until the server responds, then renders children.
 *
 * Props:
 *   healthEndpoint  – path to ping (default "/health")
 *   maxWaitMs       – give up after this many ms (default 120 000)
 *   children        – the real app content
 */
export default function BackendWakeup({
  healthEndpoint = "/health",
  maxWaitMs = 120_000,
  children,
}) {
  const [status, setStatus] = useState("checking"); // checking | waking | ready | failed
  const [stageIdx, setStageIdx] = useState(0);
  const [dots, setDots] = useState(".");
  const elapsed = useElapsed(status === "checking" || status === "waking");

  // Animated ellipsis
  useEffect(() => {
    if (status === "ready" || status === "failed") return;
    const id = setInterval(
      () => setDots((d) => (d.length >= 3 ? "." : d + ".")),
      500
    );
    return () => clearInterval(id);
  }, [status]);

  // Advance stage indicator every ~15 s while waking
  useEffect(() => {
    if (status !== "waking") return;
    const id = setInterval(
      () => setStageIdx((i) => Math.min(i + 1, STAGES.length - 1)),
      14_000
    );
    return () => clearInterval(id);
  }, [status]);

  const ping = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}${healthEndpoint}`, {
        signal: AbortSignal.timeout(8_000),
      });
      return res.ok;
    } catch {
      // Also try root – some backends don't have /health
      try {
        const res = await fetch(`${BASE_URL}/`, {
          signal: AbortSignal.timeout(8_000),
        });
        return res.ok || res.status < 500;
      } catch {
        return false;
      }
    }
  }, [healthEndpoint]);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    let delay = 2_000;

    async function attempt() {
      if (cancelled) return;

      const ok = await ping();

      if (cancelled) return;

      if (ok) {
        setStatus("ready");
        return;
      }

      const spent = Date.now() - started;
      if (spent >= maxWaitMs) {
        setStatus("failed");
        return;
      }

      // Transition to "waking" UI once the first attempt fails
      setStatus("waking");

      // Exponential back-off capped at 10 s
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.4, 10_000);

      attempt();
    }

    attempt();
    return () => {
      cancelled = true;
    };
  }, [ping, maxWaitMs]);

  if (status === "ready") return children;

  const stage = STAGES[stageIdx];
  const progressPct =
    status === "failed"
      ? 100
      : status === "checking"
      ? 8
      : stage.pct;

  return (
    <div style={styles.overlay}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.card}>
        {/* Logo / brand */}
        <div style={styles.brand}>
          <i className="bi bi-boxes" style={styles.brandIcon} />
          <span style={styles.brandText}>InVex</span>
        </div>

        {status !== "failed" ? (
          <>
            {/* Spinning icon */}
            <div style={styles.iconWrap}>
              <div style={styles.iconRing} />
              <i className={`bi ${stage.icon}`} style={styles.centerIcon} />
            </div>

            <h2 style={styles.heading}>
              {status === "checking" ? "Connecting" : "Starting up"}
              <span style={{ letterSpacing: 1 }}>{dots}</span>
            </h2>
            <p style={styles.subText}>{stage.label}</p>

            {/* Progress bar */}
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progressPct}%`,
                }}
              />
            </div>

            {/* Info message */}
            <div style={styles.infoBox}>
              <i
                className="bi bi-info-circle-fill"
                style={{ color: "#6366f1", marginRight: 8, flexShrink: 0 }}
              />
              <span style={styles.infoText}>
                The server runs on Render's free tier and may take up to{" "}
                <strong>90 seconds</strong> to wake from sleep. Hang tight!
              </span>
            </div>

            {/* Elapsed */}
            {elapsed > 3 && (
              <p style={styles.elapsed}>
                ⏱ Elapsed: <strong>{formatElapsed(elapsed)}</strong>
              </p>
            )}

            {/* Tip after 20 s */}
            {elapsed >= 20 && (
              <p style={styles.tip}>
                💡 Tip: Free tier servers spin down after 15 minutes of
                inactivity. First load always takes a moment.
              </p>
            )}
          </>
        ) : (
          <>
            <div style={styles.failIcon}>
              <i className="bi bi-exclamation-triangle-fill" />
            </div>
            <h2 style={{ ...styles.heading, color: "#ef4444" }}>
              Server Unreachable
            </h2>
            <p style={styles.subText}>
              We couldn't connect to the backend after {formatElapsed(elapsed)}.
            </p>
            <div style={{ ...styles.infoBox, borderColor: "#fca5a5", background: "#fef2f2" }}>
              <i
                className="bi bi-exclamation-circle-fill"
                style={{ color: "#ef4444", marginRight: 8, flexShrink: 0 }}
              />
              <span style={styles.infoText}>
                The server may be experiencing issues. Please try again or check
                back later.
              </span>
            </div>
            <button
              style={styles.retryBtn}
              onClick={() => window.location.reload()}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflow: "hidden",
    zIndex: 9999,
  },

  // Decorative blobs
  blob1: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
    top: "-100px",
    left: "-100px",
    animation: "none",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
    bottom: "-80px",
    right: "-80px",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
    top: "40%",
    right: "15%",
    pointerEvents: "none",
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 24,
    padding: "48px 40px",
    maxWidth: 460,
    width: "90%",
    textAlign: "center",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    position: "relative",
    zIndex: 1,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 32,
  },
  brandIcon: { fontSize: 28, color: "#818cf8" },
  brandText: {
    fontSize: 24,
    fontWeight: 700,
    color: "#e0e7ff",
    letterSpacing: 1,
  },

  iconWrap: {
    position: "relative",
    width: 80,
    height: 80,
    margin: "0 auto 24px",
  },
  iconRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "3px solid transparent",
    borderTopColor: "#6366f1",
    borderRightColor: "#8b5cf6",
    animation: "spin 1.2s linear infinite",
  },
  centerIcon: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    color: "#a5b4fc",
    lineHeight: "80px",
  },

  heading: {
    color: "#e0e7ff",
    fontSize: 22,
    fontWeight: 700,
    margin: "0 0 8px",
  },
  subText: {
    color: "#a5b4fc",
    fontSize: 14,
    margin: "0 0 24px",
  },

  progressTrack: {
    height: 6,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
    borderRadius: 99,
    transition: "width 1.5s ease",
  },

  infoBox: {
    display: "flex",
    alignItems: "flex-start",
    textAlign: "left",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 16,
  },
  infoText: {
    color: "#c7d2fe",
    fontSize: 13,
    lineHeight: 1.5,
  },

  elapsed: {
    color: "#818cf8",
    fontSize: 13,
    margin: "4px 0",
  },
  tip: {
    color: "#94a3b8",
    fontSize: 12,
    margin: "8px 0 0",
    fontStyle: "italic",
  },

  failIcon: {
    fontSize: 52,
    color: "#ef4444",
    marginBottom: 16,
  },

  retryBtn: {
    marginTop: 20,
    padding: "12px 32px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
};
