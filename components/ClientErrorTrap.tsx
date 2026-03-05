"use client";

import { useEffect } from "react";

export default function ClientErrorTrap() {
  useEffect(() => {
    const report = (payload: any) => {
      try {
        fetch("/api/client-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: typeof window !== "undefined" ? window.location.href : undefined,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
            ...payload,
          }),
          // keepalive helps on unload
          keepalive: true,
        });
      } catch {
        // ignore
      }
    };

    const onError = (event: ErrorEvent) => {
      report({
        kind: "error",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: (event.error && event.error.stack) || undefined,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason: any = event.reason;
      report({
        kind: "unhandledrejection",
        message: reason?.message || String(reason),
        stack: reason?.stack,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
