"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const href = typeof window !== "undefined" ? window.location.href : "unknown";

  return (
    <html>
      <body style={{ fontFamily: "system-ui", padding: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Mission Control Error</h1>
        <p style={{ marginTop: 8 }}>A client-side exception occurred.</p>

        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div><b>Message:</b> {error?.message || String(error)}</div>
          {error?.digest && <div><b>Digest:</b> {error.digest}</div>}
          <div style={{ marginTop: 8 }}><b>URL:</b> {href}</div>
          <div style={{ marginTop: 8 }}><b>User-Agent:</b> {ua}</div>
          {error?.stack && (
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 12, fontSize: 12, lineHeight: 1.35 }}>
              {error.stack}
            </pre>
          )}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              try {
                navigator.clipboard?.writeText(
                  `Message: ${error?.message}\nDigest: ${error?.digest || ""}\nURL: ${href}\nUA: ${ua}\n\n${error?.stack || ""}`
                );
              } catch {}
              alert("Copied error details (if clipboard allowed). You can paste into Telegram.");
            }}
          >
            Copy error details
          </button>
          <button onClick={() => reset()}>Try again</button>
          <button onClick={() => (window.location.href = "/sign-in")}>Go to Sign-in</button>
        </div>
      </body>
    </html>
  );
}
