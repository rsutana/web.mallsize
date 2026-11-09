<script setup lang="ts">
import type { Location } from '~/types'

defineProps<{ location: Location, checked: boolean }>()
defineEmits<{ pick: [] }>()
</script>

<template>
  <label
    class="relative flex cursor-pointer items-start gap-3.5 rounded-[14px] border-[1.5px] bg-white p-4 transition focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent-500"
    :class="checked ? 'border-brand-600 bg-[#FFF8F7] shadow-[0_0_0_3px_rgba(163,22,26,.12)]' : 'border-[#E3D8D5] hover:border-[#C9A9A4] hover:shadow-[0_4px_14px_rgba(28,20,20,.06)]'"
  >
    <input
      type="radio"
      name="location"
      class="sr-only"
      :checked="checked"
      @change="$emit('pick')"
    >
    <span
      aria-hidden="true"
      class="mt-0.5 flex size-5.5 flex-none items-center justify-center rounded-full border-2 bg-white"
      :class="checked ? 'border-brand-600' : 'border-[#C9B9B5]'"
    >
      <span
        v-if="checked"
        class="size-2.5 rounded-full bg-brand-600"
      />
    </span>
    <span class="flex min-w-0 flex-1 flex-col gap-2">
      <span class="flex items-start justify-between gap-2">
        <strong class="text-[15px] leading-snug">{{ location.name }}</strong>
        <span class="rounded-full bg-[#F3EEEC] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ink-700">{{ location.type_label }}</span>
      </span>
      <span class="flex gap-2 text-[13px] leading-snug text-ink-700">
        <UIcon
          name="i-lucide-map-pin"
          class="mt-0.5 size-4 flex-none text-brand-600"
        />
        <span>{{ location.street }}<br>Brgy. {{ location.barangay }}, {{ location.city }}, {{ location.province }}</span>
      </span>
      <span class="flex gap-2 text-[13px] text-ink-600">
        <UIcon
          name="i-lucide-user-round"
          class="mt-0.5 size-4 flex-none text-ink-400"
        />
        <span>{{ location.contact_person }} · {{ location.mobile }}</span>
      </span>
    </span>
  </label>
</template>
