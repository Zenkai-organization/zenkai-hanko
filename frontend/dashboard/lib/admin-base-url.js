export function getAdminBaseUrl() {
  return process.env.HANKO_ADMIN_BASE_URL || "http://localhost:4605"
}

export function getAdminToken() {
  const token = process.env.HANKO_ADMIN_TOKEN
  if (!token) {
    throw new Error("Missing HANKO_ADMIN_TOKEN in dashboard environment.")
  }
  return token
}
