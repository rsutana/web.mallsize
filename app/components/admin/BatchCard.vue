<script setup lang="ts">
import type { BatchSet, SetCapacity } from '~/types'

/**
 * A batch with its sets: schedule, slots left and an enrolment bar per set.
 * Shared by the admin course list and the overview. When `pending_count` is
 * present (overview), unpaid registrations holding a slot are called out.
 */
defineProps<{
  batch: {
    name: string
    status: string
    status_label: string
    sets?: Array<BatchSet | SetCapacity>
  }
}>()

const pending = (s: BatchSet | SetCapacity) => ('pending_count' in s ? s.pending_count : 0)
</script>

<template>
  <div class="rounded-[10px] border border-[#E7DDDA] bg-white p-3">
    <div class="flex items-center justify-between gap-2">
      <strong class="text-sm">{{ batch.name }}</strong>
      <UiStatusPill
        :code="batch.status"
        :label="batch.status_label"
      />
    </div>
    <ul class="mt-2.5 flex list-none flex-col gap-2.5 p-0 text-[13px]">
      <li
        v-for="s in batch.sets"
        :key="s.id"
      >
        <div class="flex justify-between gap-2.5">
          <span><strong>{{ s.name }}</strong> · {{ shortDate(s.start_date) }} – {{ shortDate(s.end_date) }} · {{ s.training_days }} days</span>
          <span
            class="font-semibold whitespace-nowrap"
            :class="slotTone(s.slots_left).text"
          >{{ s.slots_left === 0 ? 'Full' : `${s.slots_left} left` }}</span>
        </div>
        <div class="mt-1 flex items-center gap-2">
          <UiSlotBar
            class="flex-1"
            :taken="s.slots_taken"
            :slots="s.slots"
          />
          <span class="text-xs whitespace-nowrap text-ink-600">{{ s.slots_taken }}/{{ s.slots }} enrolled</span>
        </div>
        <div
          v-if="pending(s)"
          class="mt-0.5 text-right text-[11px] text-warn"
        >
          incl. {{ pending(s) }} awaiting payment
        </div>
      </li>
      <li
        v-if="!batch.sets?.length"
        class="text-ink-600"
      >
        No sets yet.
      </li>
    </ul>
  </div>
</template>
