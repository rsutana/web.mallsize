<script setup lang="ts">
import type { Batch, BatchSet, Course } from '~/types'

const props = defineProps<{ course: Course, selectedSetId?: number }>()
const emit = defineEmits<{ toggle: [], pick: [set: BatchSet] }>()

const batches = computed<Batch[]>(() => (props.course.batches ?? []).filter(b => b.sets?.length))
const current = computed(() => batches.value.slice(0, 1))
const upcoming = computed(() => batches.value.slice(1))
const chosenInUpcoming = computed(() => upcoming.value.some(b => b.sets?.some(s => s.id === props.selectedSetId)))
const showUpcoming = ref<boolean | null>(null)
const upcomingOpen = computed(() => showUpcoming.value ?? chosenInUpcoming.value)
const shown = computed(() => (upcomingOpen.value ? batches.value : current.value))

const allSets = computed(() => batches.value.flatMap(b => (b.sets ?? []).map(s => ({ ...s, batchName: b.name }))))
const chosen = computed(() => allSets.value.find(s => s.id === props.selectedSetId))
const totalLeft = computed(() => allSets.value.reduce((a, s) => a + s.slots_left, 0))
const upcomingLeft = computed(() => upcoming.value.flatMap(b => b.sets ?? []).reduce((a, s) => a + s.slots_left, 0))

function batchLeft(b: Batch) {
  return (b.sets ?? []).reduce((a, s) => a + s.slots_left, 0)
}

function unavailable(b: Batch, s: BatchSet) {
  return b.status !== 'open' || s.slots_left <= 0
}

const upIds = computed(() => upcoming.value.map(b => `c${props.course.id}-b${b.id}`).join(' '))
</script>

<template>
  <article
    class="overflow-hidden rounded-[14px] border-[1.5px] bg-white"
    :class="selectedSetId ? 'border-brand-600 shadow-[0_0_0_3px_rgba(163,22,26,.08)]' : 'border-line'"
  >
    <label class="flex cursor-pointer items-start gap-3 px-4 py-3.5">
      <input
        type="checkbox"
        class="mt-0.5 size-5 flex-none accent-brand-600"
        :checked="!!selectedSetId"
        :disabled="!selectedSetId && totalLeft === 0"
        @change="emit('toggle')"
      >
      <span class="flex flex-1 flex-wrap justify-between gap-x-5 gap-y-1.5">
        <span>
          <span class="block font-semibold">{{ course.name }}</span>
          <span class="text-[13px] text-ink-600">
            <template v-if="chosen">Selected: {{ chosen.batchName.split(' — ')[0] }}, {{ chosen.name }} · starts {{ longDate(chosen.start_date) }}</template>
            <template v-else-if="totalLeft === 0">Fully booked</template>
            <template v-else>{{ batches.length }} {{ batches.length === 1 ? 'batch' : 'batches' }} · {{ totalLeft }} slots available</template>
          </span>
        </span>
        <span class="text-right">
          <span class="block text-[17px] font-bold text-brand-600">{{ peso(course.fee) }}</span>
          <span class="text-xs text-ink-600">min. down {{ peso(course.min_down_payment) }}</span>
        </span>
      </span>
    </label>
    <div class="flex flex-col gap-3 border-t border-[#F0E6E3] px-4 pt-3.5 pb-4">
      <div
        v-for="(b, bi) in shown"
        :id="`c${course.id}-b${b.id}`"
        :key="b.id"
        role="radiogroup"
        :aria-label="`${course.name}, ${b.name}`"
        :class="bi === 0 ? '' : 'rounded-[10px] bg-surface p-3'"
      >
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-bold"
            :class="bi === 0 ? 'bg-brand-600 text-white' : 'bg-[#F3EEEC] text-ink-700'"
          >{{ bi === 0 ? 'Current batch' : 'Upcoming' }}</span>
          <strong class="text-sm">{{ b.name }}</strong>
          <span class="text-xs text-ink-600">{{ batchLeft(b) === 0 || b.status !== 'open' ? 'Fully booked' : `${batchLeft(b)} slots left in ${b.sets?.length} ${b.sets?.length === 1 ? 'set' : 'sets'}` }}</span>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,210px),1fr))] gap-2.5">
          <label
            v-for="s in b.sets"
            :key="s.id"
            class="relative flex items-start gap-2.5 rounded-xl border-[1.5px] p-3 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent-500"
            :class="unavailable(b, s)
              ? 'cursor-not-allowed border-dashed bg-[#F7F5F4] text-ink-500'
              : s.id === selectedSetId
                ? 'cursor-pointer border-brand-600 bg-[#FFF8F7] shadow-[0_0_0_3px_rgba(163,22,26,.12)]'
                : 'cursor-pointer border-[#E3D8D5] bg-white hover:border-[#C9A9A4]'"
          >
            <input
              type="radio"
              class="sr-only"
              :name="`set-${course.id}`"
              :checked="s.id === selectedSetId"
              :disabled="unavailable(b, s)"
              @change="emit('pick', s)"
            >
            <span
              aria-hidden="true"
              class="mt-px flex size-4.5 flex-none items-center justify-center rounded-full border-2 bg-white"
              :class="s.id === selectedSetId ? 'border-brand-600' : 'border-[#C9B9B5]'"
            >
              <span
                v-if="s.id === selectedSetId"
                class="size-2 rounded-full bg-brand-600"
              />
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="flex justify-between gap-1.5">
                <strong class="text-sm">{{ s.name }}</strong>
                <span
                  class="text-xs font-semibold whitespace-nowrap"
                  :class="slotTone(s.slots_left).text"
                >{{ s.slots_left === 0 ? 'Full' : `${s.slots_left} of ${s.slots} left` }}</span>
              </span>
              <span class="text-xs text-ink-700">{{ longDate(s.start_date) }} – {{ longDate(s.end_date) }}</span>
              <span class="text-xs text-ink-600">{{ s.training_days }} training days · {{ s.time_label }}</span>
              <UiSlotBar
                class="mt-0.5"
                :taken="s.slots_taken"
                :slots="s.slots"
                height="h-[5px]"
              />
            </span>
          </label>
        </div>
      </div>
      <button
        v-if="upcoming.length"
        type="button"
        class="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-line-strong bg-surface px-3 text-left text-[13px] font-semibold text-brand-600 hover:border-[#C9A9A4] hover:bg-brand-50"
        :aria-expanded="upcomingOpen"
        :aria-controls="upIds"
        @click="showUpcoming = !upcomingOpen"
      >
        <UIcon
          name="i-lucide-chevron-down"
          class="size-4 transition-transform"
          :class="upcomingOpen ? 'rotate-180' : ''"
        />
        <span>{{ upcomingOpen ? 'Hide upcoming batches' : `Show ${upcoming.length} upcoming ${upcoming.length === 1 ? 'batch' : 'batches'}` }}</span>
        <span class="ml-auto text-xs font-medium text-ink-600">{{ !upcomingOpen && chosenInUpcoming ? 'Your selected set is here' : !upcomingOpen ? `${upcomingLeft} slots open` : '' }}</span>
      </button>
    </div>
  </article>
</template>
