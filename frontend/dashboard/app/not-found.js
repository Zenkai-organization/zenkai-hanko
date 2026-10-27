export default function NotFound() {
  return (
    <main className="container">
      <h1>Page Not Found</h1>
      <p className="muted">The page you requested does not exist.</p>
      <a className="btn" href="/admin/users">
        Go to Users
      </a>
    </main>
  )
}
