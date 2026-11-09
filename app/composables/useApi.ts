import type { Wrapped } from '~/types'

/**
 * The only way to call api.mallsize. Wraps the Sanctum client, which sends
 * credentials and the XSRF token. Paths are relative to /api/v1.
 */
export function useApi() {
  const client = useSanctumClient()

  function url(path: string) {
    return path.startsWith('/') && !path.startsWith('/api/') && !['/login', '/logout', '/forgot-password', '/reset-password', '/user/password'].includes(path)
      ? `/api/v1${path}`
      : path
  }

  return {
    client,
    url,
    /** GET a `{ data }` resource and unwrap it. */
    async get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
      const res = await client<Wrapped<T>>(url(path), { query })
      return res.data
    },
    /** GET a raw (unwrapped or paginated) response. */
    raw<T>(path: string, query?: Record<string, unknown>): Promise<T> {
      return client<T>(url(path), { query })
    },
    async post<T>(path: string, body?: Record<string, unknown> | FormData): Promise<T> {
      const res = await client<Wrapped<T> | undefined>(url(path), { method: 'POST', body })
      return (res && typeof res === 'object' && 'data' in res ? res.data : res) as T
    },
    async put<T>(path: string, body?: Record<string, unknown>): Promise<T> {
      const res = await client<Wrapped<T> | undefined>(url(path), { method: 'PUT', body })
      return (res && typeof res === 'object' && 'data' in res ? res.data : res) as T
    },
    async patch<T>(path: string, body?: Record<string, unknown>): Promise<T> {
      return client<T>(url(path), { method: 'PATCH', body })
    },
    async del(path: string): Promise<void> {
      await client(url(path), { method: 'DELETE' })
    },
    /** Absolute URL for downloads (e.g. CSV export). */
    absolute(path: string, query?: Record<string, unknown>) {
      const base = useSanctumConfig().baseUrl.replace(/\/$/, '')
      const qs = new URLSearchParams(Object.entries(query ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString()
      return `${base}${url(path)}${qs ? `?${qs}` : ''}`
    }
  }
}
