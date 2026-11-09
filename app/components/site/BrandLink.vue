<script setup lang="ts">
const site = useAppConfig().site
</script>

<template>
  <NuxtLink
    to="/"
    class="flex min-w-0 items-center gap-3 rounded-lg p-1 text-ink-900 no-underline"
  >
    <BrandLogo />
    <span class="min-w-0 text-left leading-tight">
      <span class="block text-[15px] font-bold text-ink-900">Training Center</span>
      <span class="block truncate text-[11px] text-ink-500">{{ site.accreditation }}</span>
    </span>
  </NuxtLink>
</template>
