<script setup lang="ts">
const route = useRoute()
const site = useAppConfig().site
const open = ref(false)

watch(() => route.fullPath, () => {
  open.value = false
})
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-line bg-white">
    <div class="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-4 py-3 sm:px-6">
      <!-- Burger sits beside the logo, vertically centred with it. -->
      <div class="flex min-w-0 items-center gap-1">
        <UButton
          class="shrink-0 lg:hidden"
          color="neutral"
          variant="ghost"
          size="xl"
          icon="i-lucide-menu"
          aria-label="Open menu"
          aria-haspopup="dialog"
          :aria-expanded="open"
          @click="open = true"
        />
        <SiteBrandLink />
      </div>

      <div class="hidden lg:block">
        <SiteNavLinks />
      </div>
    </div>

    <!-- Mobile drawer: slides in from the left edge. -->
    <USlideover
      v-model:open="open"
      side="left"
      :description="`${site.name} menu`"
      :close="{ size: 'xl' }"
      :ui="{ content: 'max-w-[320px]', header: 'min-h-0 py-3 pe-14', description: 'sr-only' }"
    >
      <template #title>
        <SiteBrandLink />
      </template>
      <template #body>
        <SiteNavLinks vertical />
      </template>
    </USlideover>
  </header>
</template>
