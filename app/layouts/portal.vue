<script setup lang="ts">
const { user, logout } = useCurrentUser()
const portal = usePortalStore()
const route = useRoute()

const nav = computed(() => [
  { label: 'Dashboard', to: '/portal', icon: 'i-lucide-layout-dashboard' },
  { label: 'My courses', to: '/portal/courses', icon: 'i-lucide-book-open' },
  { label: 'Payments', to: '/portal/payments', icon: 'i-lucide-wallet', badge: portal.unpaid.length || undefined },
  { label: 'Profile', to: '/portal/profile', icon: 'i-lucide-user-round' }
])

const initials = computed(() => (user.value?.student?.first_name?.[0] ?? '') + (user.value?.student?.last_name?.[0] ?? ''))

function active(to: string) {
  return to === '/portal' ? route.path === '/portal' : route.path.startsWith(to)
}

async function signOut() {
  portal.reset()
  await logout()
}

onMounted(() => {
  if (!portal.dashboard) portal.refresh().catch(() => {})
})
</script>

<template>
  <div class="flex min-h-screen flex-wrap items-start bg-surface-portal">
    <aside class="max-w-full flex-[1_1_240px] self-stretch border-r border-line bg-white px-4 py-5 md:max-w-[280px]">
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 px-1.5 pt-1 pb-4 text-ink-900 no-underline"
      >
        <BrandLogo size="sm" />
        <span class="text-sm font-bold">Student portal</span>
      </NuxtLink>
      <div class="mb-4 flex items-center gap-3 rounded-xl bg-surface p-3">
        <div
          aria-hidden="true"
          class="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-accent-500 font-bold"
        >
          {{ initials }}
        </div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold">
            {{ user?.student?.full_name ?? user?.name }}
          </div>
          <div class="text-xs text-ink-600">
            {{ user?.student?.reference_no }}
          </div>
        </div>
      </div>
      <nav
        aria-label="Portal"
        class="flex flex-col gap-1"
      >
        <NuxtLink
          v-for="n in nav"
          :key="n.to"
          :to="n.to"
          class="flex min-h-11 items-center gap-2.5 rounded-[10px] px-3.5 text-[15px] font-medium no-underline"
          :class="active(n.to) ? 'bg-brand-600 text-white hover:text-white' : 'text-ink-700 hover:bg-tint hover:text-brand-700'"
          :aria-current="active(n.to) ? 'page' : undefined"
        >
          <UIcon
            :name="n.icon"
            class="size-5"
          />
          {{ n.label }}
          <span
            v-if="n.badge"
            class="ml-auto rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-ink-900"
            :aria-label="`${n.badge} with balance`"
          >{{ n.badge }}</span>
        </NuxtLink>
        <button
          type="button"
          class="mt-3 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[10px] px-3.5 text-left text-[15px] font-medium text-ink-600 hover:bg-tint"
          @click="signOut"
        >
          <UIcon
            name="i-lucide-log-out"
            class="size-5"
          />
          Log out
        </button>
      </nav>
    </aside>
    <main class="min-w-0 flex-[999_1_640px] px-[clamp(16px,3vw,40px)] pt-7 pb-14">
      <slot />
    </main>
  </div>
</template>
