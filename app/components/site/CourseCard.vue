<script setup lang="ts">
import type { Course } from '~/types'

const props = defineProps<{ course: Course }>()

/** Null when the API sent no slot data, so the badge stays hidden. */
const slotsLeft = computed(() => {
  const total = props.course.total_slots ?? 0
  if (total <= 0) return null
  return Math.max(0, total - (props.course.slots_taken ?? 0))
})

const isFull = computed(() => slotsLeft.value === 0)
</script>

<template>
  <article
    class="
      group flex h-full flex-col overflow-hidden rounded-2xl border border-line
      bg-white transition duration-200
      hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg
    "
  >
    <div class="relative aspect-16/10 overflow-hidden bg-tint">
      <NuxtImg
        v-if="course.image_url"
        :src="course.image_url"
        :alt="course.name"
        class="
          size-full object-cover transition duration-300
          group-hover:scale-105
        "
      />
      <div
        v-else
        class="flex size-full items-center justify-center text-brand-300"
      >
        <UIcon
          name="i-lucide-graduation-cap"
          class="size-12"
        />
      </div>
      <span
        v-if="slotsLeft !== null"
        class="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm"
        :class="isFull
          ? 'bg-bad-bg text-bad'
          : slotsLeft <= 5
            ? 'bg-note text-warn'
            : 'bg-ok-bg text-ok'"
      >
        {{ isFull ? 'Full' : `${slotsLeft} ${slotsLeft === 1 ? 'slot' : 'slots'} left` }}
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-5">
      <h3 class="m-0 text-lg/snug font-semibold">
        {{ course.name }}
      </h3>
      <p
        v-if="course.description"
        class="m-0 line-clamp-3 text-sm text-ink-600"
      >
        {{ course.description }}
      </p>
      <ul class="m-0 flex list-none flex-wrap gap-2 p-0 text-[13px] text-ink-600">
        <li class="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1">
          <UIcon
            name="i-lucide-calendar-days"
            class="size-3.5 text-ink-400"
          />
          {{ course.next_start_date ? `Next batch ${longDate(course.next_start_date)}` : 'Schedule TBA' }}
        </li>
        <li
          v-if="course.training_days"
          class="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1"
        >
          <UIcon
            name="i-lucide-clock"
            class="size-3.5 text-ink-400"
          />
          {{ course.training_days }} training days
        </li>
      </ul>

      <div class="mt-auto flex flex-col gap-4 border-t border-line pt-4">
        <div>
          <p class="m-0 text-2xl font-bold text-brand-600">
            {{ peso(course.fee) }}
          </p>
          <p class="m-0 text-[13px] text-ink-500">
            Down payment from {{ peso(course.min_down_payment) }}
          </p>
        </div>
        <UButton
          :to="isFull ? undefined : { path: '/register', query: { course: course.slug } }"
          :label="isFull ? 'Batch full' : 'Enroll now'"
          :trailing-icon="isFull ? undefined : 'i-lucide-arrow-right'"
          :disabled="isFull"
          block
        />
      </div>
    </div>
  </article>
</template>
