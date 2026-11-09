<script setup lang="ts">
import type { Course } from '~/types'

defineProps<{ course: Course }>()
</script>

<template>
  <article class="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
    <NuxtImg
      v-if="course.image_url"
      :src="course.image_url"
      :alt="course.name"
      class="h-[140px] w-full object-cover"
    />
    <div
      v-else
      class="flex h-[140px] items-center justify-center bg-tint text-[13px] text-ink-400"
    >
      [Course photo]
    </div>
    <div class="flex flex-1 flex-col gap-2.5 p-5">
      <h3 class="m-0 text-[19px] font-semibold">
        {{ course.name }}
      </h3>
      <p class="m-0 text-sm text-ink-600">
        {{ course.training_days ?? '—' }} training days · Next batch {{ longDate(course.next_start_date) }}
      </p>
      <div class="mt-auto flex items-baseline gap-2">
        <span class="text-[26px] font-bold text-brand-600">{{ peso(course.fee) }}</span>
        <span class="text-[13px] text-ink-600">down payment from {{ peso(course.min_down_payment) }}</span>
      </div>
      <UButton
        :to="{ path: '/register', query: { course: course.slug } }"
        label="Enroll in this course"
        block
      />
    </div>
  </article>
</template>
