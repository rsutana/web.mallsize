<script setup lang="ts">
const { user, isAdmin, logout } = useCurrentUser()
const admin = useAdminStore()
const route = useRoute()

const nav = computed(() => [
  { label: 'Overview', to: '/admin', icon: 'i-lucide-layout-dashboard' },
  { label: 'Payments', to: '/admin/payments', icon: 'i-lucide-badge-check', badge: admin.overview?.payments_to_verify || undefined },
  { label: 'Enrolled students', to: '/admin/students', icon: 'i-lucide-users' },
  { label: 'News', to: '/admin/news', icon: 'i-lucide-newspaper' },
  { label: 'Orientations', to: '/admin/orientations', icon: 'i-lucide-calendar-days' },
  ...(isAdmin.value
    ? [
        { label: 'Courses', to: '/admin/courses', icon: 'i-lucide-graduation-cap' },
        { label: 'Locations', to: '/admin/locations', icon: 'i-lucide-map-pin' }
      ]
    : [])
])

const roleNote = computed(() => isAdmin.value
  ? 'Admin: everything staff can do, plus course setup (fees, batches, sets) and partner locations.'
  : 'Staff: verify payments, post news and orientations, view and export enrolled students. Students are enrolled automatically once their down payment goes through.')

function active(to: string) {
  return to === '/admin' ? route.path === '/admin' : route.path.startsWith(to)
}

onMounted(() => {
  admin.refreshOverview().catch(() => {})
})
</script>

<template>
  <div class="flex min-h-screen flex-wrap items-stretch bg-surface-admin">
    <aside class="max-w-full flex-[1_1_230px] bg-dark px-3.5 py-4.5 text-white md:max-w-[270px]">
      <div class="flex items-center gap-2.5 px-1.5 pt-1 pb-4">
        <BrandLogo
          tone="light"
          size="sm"
        />
        <span class="text-[13px] font-semibold text-[#E8DCDA]">Back office</span>
      </div>
      <div class="mb-4 rounded-[9px] bg-dark-2 px-3 py-2.5 text-xs">
        <div class="text-[11px] tracking-[.6px] text-ink-300 uppercase">
          Signed in as
        </div>
        <div class="truncate font-semibold text-white">
          {{ user?.name }}
        </div>
        <span class="mt-1 inline-block rounded-md bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-ink-900">{{ user?.role_label }}</span>
      </div>
      <nav
        aria-label="Back office"
        class="flex flex-col gap-0.5"
      >
        <NuxtLink
          v-for="n in nav"
          :key="n.to"
          :to="n.to"
          class="flex min-h-11 items-center gap-2.5 rounded-[10px] px-3.5 text-sm font-medium no-underline"
          :class="active(n.to) ? 'bg-brand-600 text-white hover:text-white' : 'text-[#E8DCDA] hover:bg-dark-2 hover:text-white'"
          :aria-current="active(n.to) ? 'page' : undefined"
        >
          <UIcon
            :name="n.icon"
            class="size-[18px]"
          />
          <span>{{ n.label }}</span>
          <span
            v-if="n.badge"
            class="ml-auto rounded-full bg-accent-500 px-2 py-px text-[11px] font-bold text-ink-900"
            :aria-label="`${n.badge} to verify`"
          >{{ n.badge }}</span>
        </NuxtLink>
        <button
          type="button"
          class="mt-3.5 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[10px] px-3.5 text-left text-sm font-medium text-ink-300 hover:bg-dark-2 hover:text-white"
          @click="logout()"
        >
          <UIcon
            name="i-lucide-log-out"
            class="size-[18px]"
          />
          Sign out
        </button>
      </nav>
      <div class="mt-5.5 rounded-[10px] bg-dark-2 p-3 text-xs leading-normal text-[#E8DCDA]">
        {{ roleNote }}
      </div>
    </aside>
    <main class="min-w-0 flex-[999_1_680px] px-[clamp(16px,2.5vw,36px)] pt-6 pb-14">
      <slot />
    </main>
  </div>
</template>
