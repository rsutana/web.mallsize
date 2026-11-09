<script setup lang="ts">
import type { Course, GalleryPhoto, Testimonial } from '~/types'

useSeoMeta({ title: 'Home' })

const api = useApi()
const site = useAppConfig().site

const { data } = await useAsyncData('home', async () => {
  const [courses, photos, reviews] = await Promise.all([
    api.get<Course[]>('/courses'),
    api.get<GalleryPhoto[]>('/gallery-photos'),
    api.get<Testimonial[]>('/testimonials')
  ])
  return { courses, photos, reviews }
})

const steps = [
  { n: 1, t: 'Register online', d: 'Create your login and fill in your personal details.' },
  { n: 2, t: 'Choose location & schedule', d: 'Pick a partner meat shop, then the course batch and set that fits your schedule.' },
  { n: 3, t: 'Pay your down payment', d: 'Pay with Maya, QR Ph, GCash, ShopeePay or a debit/credit card. You’re enrolled right away.' },
  { n: 4, t: 'Attend training', d: 'Settle the remaining balance when your training starts and show up ready to cut.' }
]
</script>

<template>
  <div>
    <section class="bg-brand-700">
      <div class="mx-auto max-w-[1240px] px-6 pt-8">
        <img
          src="/images/hero-banner.png"
          alt="MallSize Training Center — trainers in Mall Size Butchery uniforms"
          class="block h-auto w-full rounded-t-2xl"
          width="2048"
          height="982"
        >
      </div>
    </section>
    <section class="bg-brand-600 text-white">
      <div class="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-5 px-6 py-7">
        <div class="flex-[1_1_520px]">
          <h1 class="display m-0 text-[40px] leading-[1.05]">
            Learn butchery from industry practitioners
          </h1>
          <p class="mt-2 mb-0 text-base text-[#FFE9E9]">
            Hands-on meat processing courses. Enroll in one or several, start with a down payment, and settle the balance before your training starts.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <UButton
            to="/courses"
            color="secondary"
            label="View courses"
            class="text-ink-900"
          />
          <UButton
            to="/register"
            label="Register & enroll"
            variant="outline"
            class="border-2 border-white/70 text-white ring-0 hover:bg-white/10"
          />
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-[1240px] px-6 pt-14 pb-6">
      <p class="eyebrow">
        How enrollment works
      </p>
      <h2 class="display mt-1.5 mb-7 text-[36px]">
        Four steps to your first training day
      </h2>
      <ol class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 p-0">
        <li
          v-for="s in steps"
          :key="s.n"
          class="rounded-[14px] border border-line bg-white p-5.5"
        >
          <div class="flex size-10 items-center justify-center rounded-full bg-accent-500 font-bold">
            {{ s.n }}
          </div>
          <h3 class="mt-3.5 mb-1.5 text-[17px] font-semibold">
            {{ s.t }}
          </h3>
          <p class="m-0 text-sm leading-relaxed text-ink-600">
            {{ s.d }}
          </p>
        </li>
      </ol>
    </section>

    <section class="mx-auto max-w-[1240px] px-6 pt-8 pb-16">
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <SiteSectionTitle
          eyebrow="Featured courses"
          title="Pick your track"
        />
        <UButton
          to="/courses"
          variant="outline"
          label="All courses"
        />
      </div>
      <div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4.5">
        <SiteCourseCard
          v-for="c in data?.courses.slice(0, 2)"
          :key="c.id"
          :course="c"
        />
      </div>
    </section>

    <section class="bg-dark text-white">
      <div class="mx-auto max-w-[1240px] px-6 py-14">
        <div class="mb-5.5 flex flex-wrap items-end justify-between gap-3">
          <SiteSectionTitle
            eyebrow="Inside the training center"
            title="Gallery"
            dark
          />
          <UButton
            to="/gallery"
            label="View all photos"
            variant="outline"
            class="border-2 border-white/70 text-white ring-0 hover:bg-white/10"
          />
        </div>
        <SiteGalleryCarousel
          v-if="data?.photos.length"
          :photos="data.photos"
        />
      </div>
    </section>

    <section class="mx-auto max-w-[1240px] px-6 py-16">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SiteSectionTitle
          eyebrow="Student reviews"
          title="What our graduates say"
        />
        <div class="flex items-center gap-3.5 rounded-[14px] border border-line bg-white px-4.5 py-3">
          <span class="text-[32px] font-bold text-brand-600">{{ site.stats.rating }}</span>
          <span>
            <span
              aria-label="Average rating out of 5 stars"
              class="text-lg tracking-[2px] text-warn-bar"
            >★★★★★</span>
            <span class="block text-[13px] text-ink-600">from {{ site.stats.reviews }} graduate reviews</span>
          </span>
        </div>
      </div>
      <SiteReviewsCarousel
        v-if="data?.reviews.length"
        :reviews="data.reviews"
      />
      <div class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-600 px-7 py-6 text-white">
        <div>
          <div class="display text-[26px]">
            Be our next graduate
          </div>
          <div class="text-[15px] text-[#FFE4E4]">
            Reserve your slot with a down payment.
          </div>
        </div>
        <UButton
          to="/register"
          color="secondary"
          label="Enroll now"
          class="text-ink-900"
        />
      </div>
    </section>
  </div>
</template>
