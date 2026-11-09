<script setup lang="ts">
defineProps<{ text: string, qrImage?: string | null }>()
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="rounded-[14px] border border-line px-5 py-9 text-center"
  >
    <template v-if="qrImage">
      <img
        :src="qrImage"
        alt="QR Ph code to scan with your banking or e-wallet app"
        class="mx-auto mb-3.5 size-56"
      >
      <strong class="block text-base">Scan to pay</strong>
      <span class="text-sm text-ink-600">Open your banking or e-wallet app and scan this QR Ph code. This page updates once paid.</span>
    </template>
    <template v-else>
      <UIcon
        name="i-lucide-loader-circle"
        class="mx-auto mb-3.5 size-11 animate-spin text-brand-600 motion-reduce:animate-none"
      />
      <strong class="block text-base">Processing your payment…</strong>
      <span class="text-sm text-ink-600">{{ text }}</span>
    </template>
  </div>
</template>
