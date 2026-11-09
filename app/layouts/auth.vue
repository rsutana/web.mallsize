<script setup lang="ts">
const route = useRoute()
const site = useAppConfig().site
const staff = computed(() => route.path.startsWith('/staff'))
</script>

<template>
  <div class="flex min-h-screen flex-wrap">
    <section
      class="flex flex-[1_1_480px] flex-col justify-between gap-8 p-12 text-white"
      :class="staff ? 'bg-dark' : 'bg-brand-600'"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 text-white no-underline hover:text-white"
      >
        <BrandLogo tone="light" />
        <span class="font-bold">{{ staff ? 'Back office' : 'Training Center' }}</span>
      </NuxtLink>
      <div>
        <h1 class="display m-0 text-[56px] leading-none">
          <template v-if="staff">
            Staff<br>sign-in
          </template>
          <template v-else>
            Student<br>portal
          </template>
        </h1>
        <p class="mt-4 max-w-[420px] text-[17px] leading-relaxed text-[#FFE4E4]">
          {{ staff
            ? 'Verify payments, manage enrolled students, post news and orientations.'
            : 'Check your balances, pay for your courses and see your training schedules.' }}
        </p>
      </div>
      <p class="m-0 text-[13px] text-[#FFD5D5]">
        {{ site.tagline }}
      </p>
    </section>
    <section class="flex flex-[1_1_480px] items-center justify-center px-6 py-12">
      <div class="w-full max-w-[420px]">
        <slot />
      </div>
    </section>
  </div>
</template>
