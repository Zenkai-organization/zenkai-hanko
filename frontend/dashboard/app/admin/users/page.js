"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

function parseUserEmail(user) {
  const primary = user.emails?.find((email) => email.is_primary)
  return primary?.address || user.emails?.[0]?.address || "-"
}

function parseUsername(user) {
  if (!user?.username) return "-"
  if (typeof user.username === "string") return user.username
  if (typeof user.username === "object") return user.username.username || "-"
  return "-"
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return users

    return users.filter((user) => {
      const email = parseUserEmail(user).toLowerCase()
      return (
        user.id.toLowerCase().includes(keyword) ||
        email.includes(keyword) ||
        parseUsername(user).toLowerCase().includes(keyword)
      )
    })
  }, [query, users])

  async function loadUsers() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/admin/users?page=1&per_page=100", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Failed to load users (${response.status})`)
      }
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function createUser(event) {
    event.preventDefault()
    if (!newEmail.trim()) return

    setBusy(true)
    setError("")
    try {
      const payload = {
        emails: [{ address: newEmail.trim(), is_primary: true, is_verified: true }],
      }
      if (newUsername.trim()) {
        payload.username = newUsername.trim()
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const details = await response.text()
        throw new Error(`Create user failed (${response.status}): ${details}`)
      }
      setNewEmail("")
      setNewUsername("")
      await loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>User Dashboard (MVP)</h1>
        <button className="btn" onClick={loadUsers} disabled={loading}>
          Refresh
        </button>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        Clerk-style starter view backed by Hanko Admin API.
      </p>

      <section className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={createUser} className="row" style={{ flexWrap: "wrap" }}>
          <input
            className="input"
            type="email"
            placeholder="new user email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            required
          />
          <input
            className="input"
            placeholder="username (optional)"
            value={newUsername}
            onChange={(event) => setNewUsername(event.target.value)}
          />
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create User"}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Search by id/email/username..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ width: 360, maxWidth: "100%" }}
          />
          <span className="muted">Total: {filtered.length}</span>
        </div>

        {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}
        {loading ? (
          <p className="muted">Loading users...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Email</th>
                <th>Username</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link href={`/admin/users/${user.id}`}>{user.id}</Link>
                  </td>
                  <td>{parseUserEmail(user)}</td>
                  <td>{parseUsername(user)}</td>
                  <td>{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
