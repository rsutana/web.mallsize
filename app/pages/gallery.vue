<script setup lang="ts">
import type { GalleryPhoto } from '~/types'

useSeoMeta({ title: 'Gallery' })

const api = useApi()
const lookups = useLookups()
const tag = ref('all')

const { data: photos } = await useAsyncData('gallery', async () => {
  await lookups.load()
  return api.get<GalleryPhoto[]>('/gallery-photos')
})

const tabs = computed(() => [{ code: 'all', label: 'All' }, ...lookups.options('gallery_tags')])
const shown = computed(() => (photos.value ?? []).filter(p => tag.value === 'all' || p.tag === tag.value))
</script>

<template>
  <section class="mx-auto max-w-[1240px] px-6 pt-12 pb-16">
    <h1 class="display m-0 mb-2 text-[44px]">
      Gallery
    </h1>
    <p class="mt-0 mb-5 text-ink-600">
      Training sessions, graduations and batch photos.
    </p>
    <div
      class="mb-5 flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter photos"
    >
      <button
        v-for="t in tabs"
        :key="t.code"
        type="button"
        role="tab"
        :aria-selected="tag === t.code"
        class="min-h-11 cursor-pointer rounded-lg px-3.5 text-[15px] font-medium"
        :class="tag === t.code ? 'bg-brand-50 font-semibold text-brand-600' : 'text-ink-700 hover:bg-tint'"
        @click="tag = t.code"
      >
        {{ t.label }}
      </button>
    </div>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
      <figure
        v-for="p in shown"
        :key="p.id"
        class="m-0 overflow-hidden rounded-[14px] border border-line bg-white"
      >
        <img
          v-if="p.image_url"
          :src="p.image_url"
          :alt="p.title"
          class="aspect-[4/3] w-full object-cover"
        >
        <div
          v-else
          class="flex aspect-[4/3] items-center justify-center bg-tint text-[13px] text-ink-400"
        >
          [Photo]
        </div>
        <figcaption class="px-3.5 py-3 text-sm">
          <strong>{{ p.title }}</strong><br><span class="text-ink-500">{{ p.tag_label }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>
