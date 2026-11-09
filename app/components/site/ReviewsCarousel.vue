<script setup lang="ts">
import type { Testimonial } from '~/types'

const props = defineProps<{ reviews: Testimonial[] }>()
const perPage = 3
const page = ref(0)
const pages = computed(() => Math.max(1, Math.ceil(props.reviews.length / perPage)))
const visible = computed(() => props.reviews.slice(page.value * perPage, page.value * perPage + perPage))

function go(i: number) {
  page.value = (i + pages.value) % pages.value
}

function stars(rating: number) {
  return '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating)
}

function initials(name: string) {
  return name.replace(/[[\]]/g, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'SN'
}
</script>

<template>
  <div>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4.5">
      <figure
        v-for="r in visible"
        :key="r.id"
        class="m-0 flex flex-col gap-3.5 rounded-2xl border border-line bg-white p-6"
      >
        <UIcon
          name="i-lucide-quote"
          class="size-8 text-accent-500"
        />
        <blockquote class="m-0 flex-1 text-base leading-relaxed text-ink-800">
          {{ r.quote }}
        </blockquote>
        <span
          :aria-label="`${r.rating} out of 5 stars`"
          class="tracking-[2px] text-warn-bar"
        >{{ stars(r.rating) }}</span>
        <figcaption class="flex items-center gap-3 border-t border-[#F3EEEC] pt-3.5">
          <span
            aria-hidden="true"
            class="flex size-11 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600"
          >{{ initials(r.student_name) }}</span>
          <span>
            <span class="block font-semibold">{{ r.student_name }}</span>
            <span class="text-[13px] text-ink-600">{{ r.course_label }}</span>
          </span>
        </figcaption>
      </figure>
    </div>
    <div
      v-if="pages > 1"
      class="mt-5.5 flex items-center justify-center gap-3"
    >
      <UButton
        variant="outline"
        icon="i-lucide-chevron-left"
        aria-label="Previous reviews"
        @click="go(page - 1)"
      />
      <button
        v-for="i in pages"
        :key="i"
        type="button"
        :aria-label="`Reviews page ${i}`"
        :aria-current="page === i - 1 ? 'true' : 'false'"
        class="h-3 cursor-pointer rounded-full p-0"
        :class="page === i - 1 ? 'w-7 bg-brand-600' : 'w-3 bg-line-strong'"
        @click="go(i - 1)"
      />
      <UButton
        variant="outline"
        icon="i-lucide-chevron-right"
        aria-label="Next reviews"
        @click="go(page + 1)"
      />
    </div>
  </div>
</template>
