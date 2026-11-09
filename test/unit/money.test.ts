import { describe, expect, it } from 'vitest'
import { peso, toCentavos } from '../../app/utils/money'

describe('peso', () => {
  it('formats whole pesos without decimals', () => {
    expect(peso(2_250_000)).toBe('₱22,500')
  })

  it('keeps centavos when present', () => {
    expect(peso(12_345)).toBe('₱123.45')
  })

  it('treats missing values as zero', () => {
    expect(peso(null)).toBe('₱0')
  })
})

describe('toCentavos', () => {
  it('converts typed pesos', () => {
    expect(toCentavos(22500)).toBe(2_250_000)
    expect(toCentavos('1,000.50')).toBe(100_050)
  })

  it('returns zero for junk', () => {
    expect(toCentavos(undefined)).toBe(0)
  })
})
