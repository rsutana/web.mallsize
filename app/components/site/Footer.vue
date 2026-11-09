<script setup lang="ts">
const site = useAppConfig().site
</script>

<template>
  <footer class="bg-dark text-[#E8DCDA]">
    <div class="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-5 px-6 py-8">
      <div>
        <div class="font-bold text-white">
          {{ site.name }}
        </div>
        <div class="text-[13px] text-ink-300">
          TESDA-accredited TVI · {{ site.tagline.replace(/\.$/, '') }}
        </div>
      </div>
      <div class="flex flex-wrap gap-4 text-sm">
        <NuxtLink
          to="/login"
          class="text-accent-500"
        >Student login</NuxtLink>
        <NuxtLink
          to="/staff/login"
          class="text-ink-300 hover:text-white"
        >Staff sign-in</NuxtLink>
      </div>
    </div>
  </footer>
</template>
