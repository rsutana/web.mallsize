<script setup lang="ts">
import { STEP_LABELS } from '~/stores/registration'

const reg = useRegistrationStore()
</script>

<template>
  <ol
    aria-label="Registration steps"
    class="m-0 mb-6 flex list-none flex-wrap gap-2 p-0"
  >
    <li
      v-for="(s, i) in reg.steps"
      :key="s"
      :aria-current="i === reg.stepIndex ? 'step' : undefined"
      class="flex items-center gap-2 rounded-full border py-2 pr-3.5 pl-2 text-sm"
      :class="[
        i === reg.stepIndex ? 'border-brand-600 bg-white font-semibold' : 'border-line font-medium',
        i <= reg.stepIndex ? 'text-ink-900' : 'text-ink-500'
      ]"
    >
      <span
        class="inline-flex size-6.5 items-center justify-center rounded-full text-[13px] font-bold"
        :class="i < reg.stepIndex ? 'bg-brand-600 text-white' : i === reg.stepIndex ? 'bg-accent-500' : 'bg-[#F3EEEC]'"
      >
        <UIcon
          v-if="i < reg.stepIndex"
          name="i-lucide-check"
          class="size-4"
        />
        <template v-else>{{ i + 1 }}</template>
      </span>
      {{ STEP_LABELS[s] }}
    </li>
  </ol>
</template>
