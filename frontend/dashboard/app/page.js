export default function HomePage() {
  return (
    <main className="container">
      <h1>Hanko Dashboard</h1>
      <p className="muted">Open the users dashboard at /admin/users.</p>
      <a className="btn" href="/admin/users">
        Go to Users
      </a>
    </main>
  )
}
