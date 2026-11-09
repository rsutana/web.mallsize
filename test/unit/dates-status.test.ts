import { describe, expect, it } from 'vitest'
import { dateParts, dateRange, longDate } from '../../app/utils/dates'
import { pillClass, slotTone } from '../../app/utils/status'

describe('dates', () => {
  it('formats ISO dates without timezone drift', () => {
    expect(longDate('2026-12-01')).toBe('Dec 1, 2026')
    expect(dateRange('2026-12-01', '2026-12-10')).toBe('Dec 1 – Dec 10, 2026')
    expect(dateParts('2026-11-28').mon).toBe('NOV')
  })

  it('shows a dash for empty values', () => {
    expect(longDate(null)).toBe('—')
  })
})

describe('status helpers', () => {
  it('colours slots by how many are left', () => {
    expect(slotTone(0).text).toBe('text-bad')
    expect(slotTone(3).text).toBe('text-warn')
    expect(slotTone(12).text).toBe('text-ok')
  })

  it('falls back to a neutral pill', () => {
    expect(pillClass('fully_paid')).toContain('text-ok')
    expect(pillClass('something-new')).toContain('text-ink-700')
  })
})
