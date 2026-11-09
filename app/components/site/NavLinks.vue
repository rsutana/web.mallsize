<script setup lang="ts">
/**
 * Main site links plus the account actions. `vertical` stacks everything for
 * the mobile drawer; otherwise it lays out inline for the desktop header.
 */
defineProps<{ vertical?: boolean }>()

const route = useRoute()
const { isAuthenticated, isStaff, home, logout } = useCurrentUser()

const nav = [
  { label: 'Home', to: '/' },
  { label: 'Orientation', to: '/orientation' },
  { label: 'Courses', to: '/courses' },
  { label: 'About', to: '/about' },
  { label: 'News', to: '/news' },
  { label: 'Contact', to: '/contact' }
]

function active(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <div
    class="flex gap-2"
    :class="vertical ? 'flex-col' : 'flex-row items-center'"
  >
    <nav
      aria-label="Main"
      class="flex gap-0.5"
      :class="vertical ? 'flex-col' : 'flex-row items-center'"
    >
      <NuxtLink
        v-for="n in nav"
        :key="n.to"
        :to="n.to"
        class="flex min-h-11 items-center rounded-lg px-3.5 py-3 text-[15px] font-medium no-underline"
        :class="active(n.to) ? 'bg-brand-50 font-semibold text-brand-600' : 'text-ink-700 hover:bg-tint hover:text-brand-700'"
        :aria-current="active(n.to) ? 'page' : undefined"
      >
        {{ n.label }}
      </NuxtLink>
    </nav>
    <span
      aria-hidden="true"
      class="bg-line"
      :class="vertical ? 'my-2 h-px w-full' : 'mx-1 h-6 w-px'"
    />
    <div
      class="flex gap-2"
      :class="vertical ? 'flex-col' : 'flex-wrap'"
    >
      <template v-if="isAuthenticated">
        <UButton
          :to="home"
          :label="isStaff ? 'Back office' : 'My portal'"
          variant="outline"
          :block="vertical"
        />
        <UButton
          label="Log out"
          color="neutral"
          variant="ghost"
          :block="vertical"
          @click="logout()"
        />
      </template>
      <template v-else>
        <UButton
          to="/login"
          label="Login"
          variant="outline"
          :block="vertical"
        />
        <UButton
          to="/register"
          label="Enroll Now"
          :block="vertical"
        />
      </template>
    </div>
  </div>
</template>
