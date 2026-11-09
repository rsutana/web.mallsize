/**
 * True once the app has hydrated. Submit buttons stay disabled until then,
 * so an early click can't fall through to a native form post (which would
 * put credentials in the URL).
 */
export function useHydrated() {
  const hydrated = useState('app-hydrated', () => false)

  onMounted(() => {
    hydrated.value = true
  })

  return hydrated
}
