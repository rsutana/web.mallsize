<script setup lang="ts">
defineProps<{ code: string | null | undefined, label: string | null | undefined }>()
</script>

<template>
  <span
    class="pill"
    :class="pillClass(code)"
  >{{ label }}</span>
</template>
