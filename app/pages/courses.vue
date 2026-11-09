<script setup lang="ts">
import type { Course } from '~/types'

useSeoMeta({ title: 'Courses & fees' })

const api = useApi()
const site = useAppConfig().site
const { data: courses } = await useAsyncData('courses', () => api.get<Course[]>('/courses'))
</script>

<template>
  <section class="mx-auto max-w-[1240px] px-6 pt-12 pb-16">
    <h1 class="display m-0 text-[44px]">
      Courses &amp; fees
    </h1>
    <p class="mt-2 mb-6 max-w-[680px] text-ink-600">
      Enroll in more than one course in a single application. A down payment reserves your slot; the remaining balance must be settled before the first training day of each course.
    </p>
    <div class="flex flex-col gap-3.5">
      <article
        v-for="c in courses"
        :key="c.id"
        class="flex flex-wrap items-center gap-x-7 gap-y-4 rounded-[14px] border border-line bg-white px-5.5 py-5"
      >
        <div class="flex-[1_1_320px]">
          <h2 class="m-0 mb-1 text-[19px] font-semibold">
            {{ c.name }}
          </h2>
          <p class="m-0 text-sm text-ink-600">
            {{ c.description }}
          </p>
        </div>
        <dl class="m-0 flex flex-wrap gap-7">
          <div>
            <dt class="text-xs text-ink-500">
              Training days
            </dt>
            <dd class="mt-0.5 font-semibold">
              {{ c.training_days ?? '—' }} days
            </dd>
          </div>
          <div>
            <dt class="text-xs text-ink-500">
              Next batch
            </dt>
            <dd class="mt-0.5 font-semibold">
              {{ longDate(c.next_start_date) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-ink-500">
              Min. down payment
            </dt>
            <dd class="mt-0.5 font-semibold">
              {{ peso(c.min_down_payment) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-ink-500">
              Course fee
            </dt>
            <dd class="mt-0.5 text-xl font-bold text-brand-600">
              {{ peso(c.fee) }}
            </dd>
          </div>
        </dl>
        <UButton
          :to="{ path: '/register', query: { course: c.slug } }"
          label="Enroll"
        />
      </article>
      <p
        v-if="!courses?.length"
        class="text-ink-600"
      >
        No courses are open for enrollment right now. Please check back soon.
      </p>
    </div>
    <div class="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-[#F4D78C] bg-note px-5.5 py-4.5">
      <p class="m-0 text-[15px]">
        <strong>We accept</strong> {{ site.acceptedPayments }}
      </p>
      <UButton
        to="/register"
        label="Start registration"
      />
    </div>
  </section>
</template>
