"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

function getUsernameValue(username) {
  if (!username) return ""
  if (typeof username === "string") return username
  if (typeof username === "object") return username.username || ""
  return ""
}

export default function UserDetailPage({ params }) {
  const userId = params.id
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [metadata, setMetadata] = useState(null)
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function loadUserData() {
    setLoading(true)
    setError("")

    try {
      const [userRes, sessionsRes, metadataRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`, { cache: "no-store" }),
        fetch(`/api/admin/users/${userId}/sessions`, { cache: "no-store" }),
        fetch(`/api/admin/users/${userId}/metadata`, { cache: "no-store" }),
      ])

      if (!userRes.ok) throw new Error(`Failed to load user (${userRes.status})`)

      const userData = await userRes.json()
      setUser(userData)
      setUsername(getUsernameValue(userData.username))

      if (sessionsRes.ok) {
        setSessions(await sessionsRes.json())
      } else {
        setSessions([])
      }

      if (metadataRes.ok) {
        setMetadata(await metadataRes.json())
      } else {
        setMetadata(null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserData()
  }, [userId])

  async function saveUsername(event) {
    event.preventDefault()
    setBusy(true)
    setError("")

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() || null }),
      })
      if (!response.ok) {
        const details = await response.text()
        throw new Error(`Failed to update user (${response.status}): ${details}`)
      }
      await loadUserData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteUser() {
    const ok = window.confirm("Delete this user permanently?")
    if (!ok) return

    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      if (!response.ok && response.status !== 204) {
        const details = await response.text()
        throw new Error(`Delete failed (${response.status}): ${details}`)
      }
      window.location.href = "/admin/users"
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function revokeSession(sessionId) {
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/users/${userId}/sessions/${sessionId}`, { method: "DELETE" })
      if (!response.ok && response.status !== 204) {
        const details = await response.text()
        throw new Error(`Revoke session failed (${response.status}): ${details}`)
      }
      await loadUserData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="container">
        <p className="muted">Loading user...</p>
      </main>
    )
  }

  return (
    <main className="container">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>User Detail</h1>
        <Link className="btn" href="/admin/users">
          Back to Users
        </Link>
      </div>

      {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}
      {!user ? <p className="muted">User not found.</p> : null}

      {user ? (
        <>
          <section className="card" style={{ marginBottom: 16 }}>
            <p className="muted" style={{ marginTop: 0 }}>
              User ID
            </p>
            <p style={{ marginTop: 0 }}>{user.id}</p>
            <p className="muted">Created: {user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</p>
            <p className="muted">Updated: {user.updated_at ? new Date(user.updated_at).toLocaleString() : "-"}</p>
          </section>

          <section className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>Profile</h2>
            <form onSubmit={saveUsername} className="row">
              <input
                className="input"
                value={username}
                placeholder="username"
                onChange={(event) => setUsername(event.target.value)}
              />
              <button className="btn" type="submit" disabled={busy}>
                Save Username
              </button>
            </form>
            <div style={{ marginTop: 12 }}>
              <strong>Emails:</strong>
              <ul>
                {(user.emails || []).map((email) => (
                  <li key={email.id || email.address}>
                    {email.address} {email.is_primary ? "(primary)" : ""} {email.is_verified ? "(verified)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>Sessions</h2>
            {sessions.length === 0 ? (
              <p className="muted">No active sessions.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Expires At</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.id}</td>
                      <td>{session.expires_at ? new Date(session.expires_at).toLocaleString() : "-"}</td>
                      <td>
                        <button className="btn" onClick={() => revokeSession(session.id)} disabled={busy}>
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>Metadata</h2>
            <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>
              {JSON.stringify(metadata || {}, null, 2)}
            </pre>
          </section>

          <section className="card">
            <h2 style={{ marginTop: 0 }}>Danger Zone</h2>
            <button className="btn btn-danger" onClick={deleteUser} disabled={busy}>
              Delete User
            </button>
          </section>
        </>
      ) : null}
    </main>
  )
}
