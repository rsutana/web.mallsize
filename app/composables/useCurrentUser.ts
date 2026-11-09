import type { Role, User } from '~/types'

/**
 * Signed-in user plus role helpers.
 */
export function useCurrentUser() {
  const { user, isAuthenticated, logout, refreshIdentity } = useSanctumAuth<User>()

  const role = computed<Role | null>(() => user.value?.role ?? null)
  const isStudent = computed(() => role.value === 'student')
  const isAdmin = computed(() => role.value === 'admin')
  const isStaff = computed(() => role.value === 'staff' || role.value === 'admin')

  /** Where this user's area starts. */
  const home = computed(() => (isStaff.value ? '/admin' : '/portal'))

  return { user, isAuthenticated, role, isStudent, isAdmin, isStaff, home, logout, refreshIdentity }
}
