import type { FormError } from '@nuxt/ui'

interface LaravelError {
  message?: string
  errors?: Record<string, string[]>
}

function payload(error: unknown): { status?: number, data?: LaravelError } {
  const e = error as { status?: number, statusCode?: number, response?: { status?: number }, data?: LaravelError }
  return { status: e?.status ?? e?.statusCode ?? e?.response?.status, data: e?.data }
}

/**
 * Turns an API failure into something a person can read.
 */
export function friendlyError(error: unknown): string {
  const { status, data } = payload(error)

  if (import.meta.dev) {
    console.error(error)
  }

  if (status === 422) {
    const first = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    return first ?? data?.message ?? 'Please check the highlighted fields.'
  }
  if (status === 401) return 'Please log in to continue.'
  if (status === 403) return data?.message ?? 'You don’t have access to this.'
  if (status === 404) return 'We couldn’t find that.'
  if (status === 419) return 'Your session expired. Please refresh the page and try again.'
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.'
  if (!status) return 'We couldn’t reach the server. Check your connection and try again.'

  return 'Something went wrong on our side. Please try again.'
}

/**
 * Laravel 422 `errors` → Nuxt UI form errors. Keys like `items.0.amount`
 * are kept as-is so fields can match them.
 */
export function validationErrors(error: unknown): FormError[] {
  const { status, data } = payload(error)

  if (status !== 422 || !data?.errors) {
    return []
  }

  return Object.entries(data.errors).map(([name, messages]) => ({ name, message: messages[0] ?? 'Invalid value' }))
}

export function useApiError() {
  const toast = useToast()

  return {
    friendlyError,
    validationErrors,
    /** Show a toast for the failure and return form errors, if any. */
    report(error: unknown, title = 'That didn’t work') {
      toast.add({ title, description: friendlyError(error), color: 'error', icon: 'i-lucide-circle-alert' })
      return validationErrors(error)
    }
  }
}
