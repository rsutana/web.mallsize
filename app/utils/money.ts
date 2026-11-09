/** ₱ from centavos, e.g. 2250000 → "₱22,500". */
export function peso(centavos: number | null | undefined): string {
  const value = (centavos ?? 0) / 100
  const decimals = Number.isInteger(value) ? 0 : 2
  return '₱' + value.toLocaleString('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** Pesos typed by a person → centavos. */
export function toCentavos(pesos: number | string | null | undefined): number {
  const n = typeof pesos === 'string' ? Number(pesos.replace(/[^\d.]/g, '')) : Number(pesos ?? 0)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}
