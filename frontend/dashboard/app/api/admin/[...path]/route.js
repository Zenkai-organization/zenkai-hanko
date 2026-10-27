import { getAdminBaseUrl, getAdminToken } from "@/lib/admin-base-url"

async function proxy(request, context) {
  const resolvedParams = await context.params
  const path = resolvedParams?.path?.join("/") || ""
  const target = new URL(`${getAdminBaseUrl().replace(/\/$/, "")}/${path}`)

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value)
  })

  const headers = new Headers()
  headers.set("Authorization", `Bearer ${getAdminToken()}`)

  let body
  if (!["GET", "HEAD"].includes(request.method)) {
    const textBody = await request.text()
    if (textBody) {
      body = textBody
      headers.set("Content-Type", request.headers.get("content-type") || "application/json")
    }
  }

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  })

  const responseBody = await upstream.text()
  const responseHeaders = new Headers()
  const contentType = upstream.headers.get("content-type")
  if (contentType) {
    responseHeaders.set("Content-Type", contentType)
  }

  return new Response(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export async function GET(request, context) {
  return proxy(request, context)
}

export async function POST(request, context) {
  return proxy(request, context)
}

export async function PATCH(request, context) {
  return proxy(request, context)
}

export async function PUT(request, context) {
  return proxy(request, context)
}

export async function DELETE(request, context) {
  return proxy(request, context)
}
