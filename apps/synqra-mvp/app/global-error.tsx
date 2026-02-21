"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body style={{ margin: 0, background: "#0d0d0d", color: "#ffffff", fontFamily: "sans-serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <section>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Unexpected Error</h1>
            <p style={{ marginTop: "0.75rem", opacity: 0.8 }}>
              {error.digest ? `Reference: ${error.digest}` : "A runtime error occurred."}
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "1rem",
                padding: "0.6rem 1rem",
                border: "1px solid #b08d57",
                background: "transparent",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

