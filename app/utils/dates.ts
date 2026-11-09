function parse(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "Dec 1, 2026" */
export function longDate(value: string | null | undefined): string {
  return parse(value)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) ?? '—'
}

/** "Dec 1" */
export function shortDate(value: string | null | undefined): string {
  return parse(value)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '—'
}

/** "December 1, 2026" */
export function fullDate(value: string | null | undefined): string {
  return parse(value)?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) ?? '—'
}

export function dateParts(value: string) {
  const d = parse(value)
  return {
    mon: d?.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() ?? '',
    day: d?.toLocaleDateString('en-US', { day: 'numeric' }) ?? '',
    dow: d?.toLocaleDateString('en-US', { weekday: 'short' }) ?? '',
    long: d?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) ?? ''
  }
}

/** Whole days from today until the date (negative when past). */
export function daysUntil(value: string | null | undefined): number {
  const d = parse(value)
  if (!d) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

/** "Dec 1 – Dec 10, 2026" */
export function dateRange(start: string | null | undefined, end: string | null | undefined): string {
  return `${shortDate(start)} – ${longDate(end)}`
}
