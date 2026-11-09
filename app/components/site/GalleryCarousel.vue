<script setup lang="ts">
import type { GalleryPhoto } from '~/types'

const props = defineProps<{ photos: GalleryPhoto[] }>()
const index = ref(0)
const n = computed(() => props.photos.length)
const slide = computed(() => props.photos[index.value])

function go(i: number) {
  index.value = (i + n.value) % n.value
}
</script>

<template>
  <div
    v-if="slide"
    aria-roledescription="carousel"
    aria-label="Training gallery"
  >
    <div class="relative overflow-hidden rounded-[18px] bg-dark-2">
      <div
        role="group"
        aria-roledescription="slide"
        :aria-label="`${index + 1} of ${n}: ${slide.title}`"
        class="flex aspect-[16/7] items-center justify-center"
      >
        <img
          v-if="slide.image_url"
          :src="slide.image_url"
          :alt="slide.title"
          class="block size-full object-cover"
        >
        <span
          v-else
          class="text-[15px] text-ink-300"
        >[Photo: {{ slide.title }}]</span>
      </div>
      <div class="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-b from-transparent to-[rgba(20,10,10,.85)] px-6 pt-12 pb-5">
        <div>
          <span class="inline-block rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-bold text-ink-900">{{ slide.tag_label }}</span>
          <div class="mt-1.5 text-xl font-semibold">
            {{ slide.title }}
          </div>
        </div>
        <div class="text-sm text-[#E8DCDA]">
          {{ index + 1 }} / {{ n }}
        </div>
      </div>
      <button
        type="button"
        aria-label="Previous photo"
        class="absolute top-1/2 left-4 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink-900"
        @click="go(index - 1)"
      >
        <UIcon
          name="i-lucide-chevron-left"
          class="size-6"
        />
      </button>
      <button
        type="button"
        aria-label="Next photo"
        class="absolute top-1/2 right-4 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink-900"
        @click="go(index + 1)"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="size-6"
        />
      </button>
    </div>
    <div class="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5">
      <button
        v-for="(p, i) in photos"
        :key="p.id"
        type="button"
        :aria-label="`Show photo ${i + 1}: ${p.title}`"
        :aria-current="i === index ? 'true' : 'false'"
        class="min-h-16 cursor-pointer rounded-[10px] border-2 p-2 text-left text-xs font-medium"
        :class="i === index ? 'border-accent-500 bg-accent-500 text-ink-900' : 'border-[#3E3030] bg-dark-2 text-[#E8DCDA]'"
        @click="go(i)"
      >
        {{ p.title.length > 22 ? p.title.slice(0, 20) + '…' : p.title }}
      </button>
    </div>
  </div>
</template>
