<script setup lang="ts">
defineProps<{ label: string, value: string | number, sub?: string, tone?: string }>()
</script>

<template>
  <div class="card rounded-[14px] px-4 py-3.5">
    <div class="text-[13px] text-ink-600">
      {{ label }}
    </div>
    <div
      class="text-[26px] font-bold"
      :class="tone"
    >
      {{ value }}
    </div>
    <div
      v-if="sub"
      class="text-xs text-ink-600"
    >
      {{ sub }}
    </div>
  </div>
</template>
