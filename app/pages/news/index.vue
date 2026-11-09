<script setup lang="ts">
import type { NewsPost } from '~/types'

useSeoMeta({ title: 'News' })

const api = useApi()
const lookups = useLookups()
const category = ref('all')

const { data: posts } = await useAsyncData('news', async () => {
  await lookups.load()
  return api.get<NewsPost[]>('/news')
})

const tabs = computed(() => [{ code: 'all', label: 'All' }, ...lookups.options('news_categories')])
const list = computed(() => (posts.value ?? []).filter(p => category.value === 'all' || p.category === category.value))
const top = computed(() => list.value[0])
const rest = computed(() => list.value.slice(1))
</script>

<template>
  <section class="mx-auto max-w-[1240px] px-6 pt-12 pb-16">
    <h1 class="display m-0 mb-2 text-[44px]">
      News
    </h1>
    <p class="mt-0 mb-5 text-ink-600">
      Announcements, enrollment updates and graduation stories from the training center.
    </p>
    <div
      class="mb-5.5 flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter news"
    >
      <button
        v-for="t in tabs"
        :key="t.code"
        type="button"
        role="tab"
        :aria-selected="category === t.code"
        class="min-h-11 cursor-pointer rounded-lg px-3.5 text-[15px] font-medium"
        :class="category === t.code ? 'bg-brand-50 font-semibold text-brand-600' : 'text-ink-700 hover:bg-tint'"
        @click="category = t.code"
      >
        {{ t.label }}
      </button>
    </div>

    <article
      v-if="top"
      class="mb-5 flex flex-wrap overflow-hidden rounded-[18px] border border-line bg-white"
    >
      <img
        v-if="top.cover_url"
        :src="top.cover_url"
        :alt="top.title"
        class="min-h-[260px] flex-[1_1_420px] object-cover"
      >
      <div
        v-else
        class="flex min-h-[260px] flex-[1_1_420px] items-center justify-center bg-tint text-[13px] text-ink-400"
      >
        [Cover photo]
      </div>
      <div class="flex flex-[1_1_380px] flex-col gap-3 p-7">
        <div class="flex flex-wrap items-center gap-2.5">
          <span class="rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-bold text-ink-900">{{ top.category_label }}</span>
          <span class="text-[13px] text-ink-600">{{ fullDate(top.published_on) }}</span>
        </div>
        <h2 class="m-0 text-[26px] leading-tight font-semibold">
          {{ top.title }}
        </h2>
        <p class="m-0 leading-relaxed text-ink-600">
          {{ top.summary }}
        </p>
        <UButton
          :to="`/news/${top.slug}`"
          label="Read more"
          class="mt-auto self-start"
        />
      </div>
    </article>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      <article
        v-for="n in rest"
        :key="n.id"
        class="flex flex-col overflow-hidden rounded-[14px] border border-line bg-white"
      >
        <img
          v-if="n.cover_url"
          :src="n.cover_url"
          :alt="n.title"
          class="aspect-video w-full object-cover"
        >
        <div
          v-else
          class="flex aspect-video items-center justify-center bg-tint text-[13px] text-ink-400"
        >
          [Cover photo]
        </div>
        <div class="flex flex-1 flex-col gap-2 p-4.5">
          <div class="text-xs text-ink-600">
            <strong class="text-brand-600">{{ n.category_label }}</strong> · {{ fullDate(n.published_on) }}
          </div>
          <h3 class="m-0 text-lg leading-snug font-semibold">
            {{ n.title }}
          </h3>
          <p class="m-0 flex-1 text-sm leading-relaxed text-ink-600">
            {{ n.summary }}
          </p>
          <UButton
            :to="`/news/${n.slug}`"
            label="Read more"
            variant="outline"
            class="self-start"
          />
        </div>
      </article>
    </div>
    <p
      v-if="!list.length"
      class="text-ink-600"
    >
      No posts in this category yet.
    </p>
  </section>
</template>
