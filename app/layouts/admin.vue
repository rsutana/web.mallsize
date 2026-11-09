<script setup lang="ts">
const admin = useAdminStore()
const route = useRoute()
const open = ref(false)

const toVerify = computed(() => admin.overview?.payments_to_verify || 0)

watch(() => route.fullPath, () => {
  open.value = false
})

onMounted(() => {
  admin.refreshOverview().catch(() => {})
})
</script>

<template>
  <div class="min-h-screen bg-surface-admin lg:flex">
    <!-- Mobile top bar: burger opens the sidebar as a left slide panel. -->
    <header class="sticky top-0 z-20 flex items-center gap-1 bg-dark px-2 py-2 text-white lg:hidden">
      <UButton
        class="shrink-0 text-white hover:bg-dark-2"
        color="neutral"
        variant="ghost"
        size="xl"
        icon="i-lucide-menu"
        aria-label="Open menu"
        aria-haspopup="dialog"
        :aria-expanded="open"
        @click="open = true"
      />
      <BrandLogo
        tone="light"
        size="sm"
      />
      <span class="ml-1 text-[13px] font-semibold text-[#E8DCDA]">Back office</span>
      <NuxtLink
        v-if="toVerify"
        to="/admin/payments"
        class="ml-auto mr-2 rounded-full bg-accent-500 px-2.5 py-0.5 text-[11px] font-bold text-ink-900 no-underline"
        :aria-label="`${toVerify} payments to verify`"
      >{{ toVerify }}</NuxtLink>
    </header>

    <aside class="hidden w-[270px] shrink-0 bg-dark px-3.5 py-4.5 text-white lg:block">
      <div class="flex items-center gap-2.5 px-1.5 pt-1 pb-4">
        <BrandLogo
          tone="light"
          size="sm"
        />
        <span class="text-[13px] font-semibold text-[#E8DCDA]">Back office</span>
      </div>
      <AdminSidebarNav />
    </aside>

    <USlideover
      v-model:open="open"
      side="left"
      description="Back office menu"
      :close="{ size: 'xl', color: 'neutral', variant: 'ghost', class: 'text-white hover:bg-dark-2' }"
      :ui="{
        content: 'max-w-[300px] bg-dark text-white ring-0 divide-dark-2',
        header: 'min-h-0 py-3 pe-14',
        description: 'sr-only',
        body: 'px-3.5 py-4'
      }"
    >
      <template #title>
        <span class="flex items-center gap-2.5">
          <BrandLogo
            tone="light"
            size="sm"
          />
          <span class="text-[13px] font-semibold text-[#E8DCDA]">Back office</span>
        </span>
      </template>
      <template #body>
        <AdminSidebarNav />
      </template>
    </USlideover>

    <main class="min-w-0 flex-1 px-[clamp(16px,2.5vw,36px)] pt-6 pb-14">
      <slot />
    </main>
  </div>
</template>
