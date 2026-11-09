<script setup lang="ts">
const props = withDefaults(defineProps<{ taken: number, slots: number, height?: string }>(), { height: 'h-1.5' })
const left = computed(() => Math.max(0, props.slots - props.taken))
const pct = computed(() => (props.slots ? Math.min(100, Math.round((props.taken / props.slots) * 100)) : 0))
const tone = computed(() => slotTone(left.value))
</script>

<template>
  <span
    class="block overflow-hidden rounded-full bg-[#F3EEEC]"
    :class="height"
    role="progressbar"
    :aria-valuenow="pct"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="`${taken} of ${slots} slots taken`"
  >
    <span
      class="block h-full"
      :class="tone.bar"
      :style="{ width: `${pct}%` }"
    />
  </span>
</template>
