"use client"

export default function ErrorPage({ error, reset }) {
  return (
    <main className="container">
      <h1>Dashboard Error</h1>
      <p className="muted">Something went wrong while rendering this page.</p>
      <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{error?.message || "Unknown error"}</pre>
      <button className="btn" onClick={reset}>
        Retry
      </button>
    </main>
  )
}
