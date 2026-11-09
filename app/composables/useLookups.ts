import type { LookupTable, Lookups, Option } from '~/types'

/**
 * Option lists from the API's lookup tables (location types, categories, …),
 * fetched once per session.
 */
export function useLookups() {
  const api = useApi()
  const state = useState<Lookups | null>('lookups', () => null)
  const pending = useState<Promise<void> | null>('lookups-pending', () => null)

  async function load() {
    if (state.value) return
    pending.value ??= api.get<Lookups>('/lookups').then((data) => {
      state.value = data
    }).finally(() => {
      pending.value = null
    })
    await pending.value
  }

  function options(table: LookupTable): Option[] {
    return state.value?.[table] ?? []
  }

  /** Items for USelect: `{ label, value }`. */
  function items(table: LookupTable) {
    return options(table).map(o => ({ label: o.label, value: o.code }))
  }

  function label(table: LookupTable, code: string | null | undefined) {
    return options(table).find(o => o.code === code)?.label ?? code ?? ''
  }

  return { load, options, items, label, lookups: state }
}
