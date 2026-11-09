<script setup lang="ts">
const route = useRoute()
const { isAuthenticated, isStaff, home, logout } = useCurrentUser()
const site = useAppConfig().site
const open = ref(false)

const nav = [
  { label: 'Home', to: '/' },
  { label: 'Orientation', to: '/orientation' },
  { label: 'Courses', to: '/courses' },
  { label: 'About', to: '/about' },
  { label: 'News', to: '/news' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/contact' }
]

function active(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

watch(() => route.fullPath, () => {
  open.value = false
})
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-line bg-white">
    <div class="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-3">
      <NuxtLink
        to="/"
        class="flex items-center gap-3 rounded-lg p-1 text-ink-900 no-underline"
      >
        <BrandLogo />
        <span class="text-left leading-tight">
          <span class="block text-[15px] font-bold text-ink-900">Training Center</span>
          <span class="block text-[11px] text-ink-500">{{ site.accreditation }}</span>
        </span>
      </NuxtLink>

      <UButton
        class="lg:hidden"
        color="neutral"
        variant="ghost"
        :icon="open ? 'i-lucide-x' : 'i-lucide-menu'"
        :aria-label="open ? 'Close menu' : 'Open menu'"
        :aria-expanded="open"
        @click="open = !open"
      />

      <div
        class="w-full flex-col gap-2 lg:flex lg:w-auto lg:flex-row lg:items-center"
        :class="open ? 'flex' : 'hidden'"
      >
        <nav
          aria-label="Main"
          class="flex flex-col gap-0.5 lg:flex-row lg:items-center"
        >
          <NuxtLink
            v-for="n in nav"
            :key="n.to"
            :to="n.to"
            class="min-h-11 rounded-lg px-3.5 py-3 text-[15px] font-medium no-underline"
            :class="active(n.to) ? 'bg-brand-50 font-semibold text-brand-600' : 'text-ink-700 hover:bg-tint hover:text-brand-700'"
            :aria-current="active(n.to) ? 'page' : undefined"
          >
            {{ n.label }}
          </NuxtLink>
        </nav>
        <span
          aria-hidden="true"
          class="mx-1 hidden h-6 w-px bg-line lg:block"
        />
        <div class="flex flex-wrap gap-2">
          <template v-if="isAuthenticated">
            <UButton
              :to="home"
              :label="isStaff ? 'Back office' : 'My portal'"
              variant="outline"
            />
            <UButton
              label="Log out"
              color="neutral"
              variant="ghost"
              @click="logout()"
            />
          </template>
          <template v-else>
            <UButton
              to="/login"
              label="Login"
              variant="outline"
            />
            <UButton
              to="/register"
              label="Enroll Now"
            />
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
