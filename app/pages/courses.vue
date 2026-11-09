<script setup lang="ts">
import type { Course } from '~/types'

useSeoMeta({ title: 'Courses & fees' })

const api = useApi()
const site = useAppConfig().site
const { data: courses } = await useAsyncData('courses', () => api.get<Course[]>('/courses'))
</script>

<template>
  <section class="mx-auto max-w-[1240px] px-4 pt-10 pb-16 sm:px-6 sm:pt-12">
    <h1 class="display m-0 text-[34px] sm:text-[44px]">
      Courses &amp; fees
    </h1>
    <p class="mt-2 mb-8 max-w-[680px] text-[15px] text-ink-600 sm:text-base">
      Enroll in more than one course in a single application. A down payment reserves your slot; the remaining balance must be settled before the first training day of each course.
    </p>

    <div
      v-if="courses?.length"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <SiteCourseCard
        v-for="c in courses"
        :key="c.id"
        :course="c"
      />
    </div>
    <div
      v-else
      class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-white px-6 py-12 text-center"
    >
      <UIcon
        name="i-lucide-calendar-x"
        class="size-10 text-ink-300"
      />
      <p class="m-0 max-w-sm text-ink-600">
        No courses are open for enrollment right now. Please check back soon.
      </p>
    </div>

    <div
      class="
        mt-8 flex flex-col gap-4 rounded-2xl border border-note-line bg-note px-5
        py-4.5
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      <div class="flex items-start gap-3">
        <UIcon
          name="i-lucide-wallet"
          class="mt-0.5 size-5 shrink-0 text-warn"
        />
        <p class="m-0 text-[15px]">
          <strong>We accept</strong> {{ site.acceptedPayments }}
        </p>
      </div>
      <UButton
        to="/register"
        label="Start registration"
        class="w-full sm:w-auto"
      />
    </div>
  </section>
</template>
