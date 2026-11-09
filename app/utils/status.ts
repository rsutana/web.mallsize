/**
 * Pill colours for status codes. Every pill also shows its label text, so
 * status is never conveyed by colour alone.
 */
const PILLS: Record<string, string> = {
  fully_paid: 'bg-ok-bg text-ok',
  verified: 'bg-ok-bg text-ok',
  paid: 'bg-info-bg text-info',
  enrolled: 'bg-ok-bg text-ok',
  open: 'bg-ok-bg text-ok',
  published: 'bg-ok-bg text-ok',
  active: 'bg-ok-bg text-ok',
  down_payment_only: 'bg-note text-[#7A4B00]',
  full: 'bg-note text-[#7A4B00]',
  pending: 'bg-info-bg text-info',
  pending_payment: 'bg-info-bg text-info',
  scheduled: 'bg-info-bg text-info',
  awaiting_payment: 'bg-bad-bg text-bad',
  failed: 'bg-bad-bg text-bad',
  rejected: 'bg-bad-bg text-bad',
  closed: 'bg-[#F3EEEC] text-ink-700',
  archived: 'bg-[#F3EEEC] text-ink-600',
  draft: 'bg-[#F3EEEC] text-ink-700',
  inactive: 'bg-[#F3EEEC] text-ink-600'
}

export function pillClass(code: string | null | undefined): string {
  return PILLS[code ?? ''] ?? 'bg-[#F3EEEC] text-ink-700'
}

/** Colour band for remaining slots: full → red, ≤5 → amber, else green. */
export function slotTone(left: number) {
  if (left <= 0) return { text: 'text-bad', bar: 'bg-brand-600' }
  if (left <= 5) return { text: 'text-warn', bar: 'bg-warn-bar' }
  return { text: 'text-ok', bar: 'bg-ok' }
}
