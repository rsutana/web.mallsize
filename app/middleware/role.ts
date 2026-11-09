export default defineNuxtRouteMiddleware((to) => {
  const roles = to.meta.roles
  if (!roles?.length) return

  const { user, home } = useCurrentUser()

  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (!roles.includes(user.value.role)) {
    return navigateTo(home.value)
  }
})
