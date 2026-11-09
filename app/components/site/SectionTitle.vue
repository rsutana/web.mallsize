<script setup lang="ts">
defineProps<{ eyebrow?: string, title: string, dark?: boolean }>()
</script>

<template>
  <div>
    <p
      v-if="eyebrow"
      class="eyebrow"
      :class="dark ? 'text-accent-500' : ''"
    >
      {{ eyebrow }}
    </p>
    <h2 class="display mt-1.5 mb-0 text-[36px]">
      {{ title }}
    </h2>
  </div>
</template>
