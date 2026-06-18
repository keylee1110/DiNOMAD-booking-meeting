const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000/api"

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BACKEND_URL}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)
  const res = await fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
  clearTimeout(timeoutId)

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}
