<script setup lang="ts">
defineProps<{ title: string, subtitle?: string }>()
</script>

<template>
  <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="m-0 mb-1 text-2xl font-semibold">
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="m-0 max-w-3xl text-sm text-ink-600"
      >
        {{ subtitle }}
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
