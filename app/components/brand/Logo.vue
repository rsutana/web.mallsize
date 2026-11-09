<script setup lang="ts">
withDefaults(defineProps<{
  /** "dark" = red pill with dark border (light backgrounds); "light" = white border (red/dark backgrounds). */
  tone?: 'dark' | 'light'
  size?: 'sm' | 'md'
}>(), { tone: 'dark', size: 'md' })
</script>

<template>
  <span
    class="inline-block rounded-[22px] bg-brand-600 font-bold tracking-[.5px] whitespace-nowrap text-white shadow-[inset_0_-3px_0_#F4B63A]"
    :class="[
      tone === 'dark' ? 'border-[3px] border-brand-700' : 'border-[3px] border-white',
      size === 'sm' ? 'px-3 py-1 text-[13px]' : 'px-4 py-1.5 text-[15px]'
    ]"
  >MALL SIZE</span>
</template>
