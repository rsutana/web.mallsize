<script setup lang="ts">
const { isAuthenticated, home } = useCurrentUser()
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-line bg-white">
      <div class="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-6 py-3.5">
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5 text-ink-900 no-underline"
        >
          <BrandLogo size="sm" />
          <span class="font-bold">Training Center</span>
        </NuxtLink>
        <p
          v-if="isAuthenticated"
          class="m-0 text-sm text-ink-600"
        >
          <NuxtLink
            :to="home"
            class="font-semibold"
          >Back to my portal</NuxtLink>
        </p>
        <p
          v-else
          class="m-0 text-sm text-ink-600"
        >
          Already registered? <NuxtLink
            to="/login"
            class="font-semibold"
          >Log in</NuxtLink>
        </p>
      </div>
    </header>
    <main class="mx-auto max-w-[1100px] px-6 pt-9 pb-16">
      <slot />
    </main>
  </div>
</template>
