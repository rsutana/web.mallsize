<script setup lang="ts">
import type { NewsPost } from '~/types'

const route = useRoute()
const api = useApi()

const { data: post, error } = await useAsyncData(`news-${route.params.slug}`, () => api.get<NewsPost>(`/news/${route.params.slug}`))

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

useSeoMeta({ title: () => post.value?.title ?? 'News', description: () => post.value?.summary ?? '' })
</script>

<template>
  <section class="mx-auto max-w-[1240px] px-6 pt-12 pb-16">
    <article
      v-if="post"
      class="mx-auto max-w-[780px]"
    >
      <UButton
        to="/news"
        variant="outline"
        label="← All news"
        class="mb-5"
      />
      <div class="flex flex-wrap items-center gap-2.5">
        <span class="rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-bold text-ink-900">{{ post.category_label }}</span>
        <span class="text-sm text-ink-600">{{ fullDate(post.published_on) }} · MallSize Training Center</span>
      </div>
      <h1 class="mt-3 mb-5 text-4xl leading-tight font-semibold">
        {{ post.title }}
      </h1>
      <img
        v-if="post.cover_url"
        :src="post.cover_url"
        :alt="post.title"
        class="mb-6 aspect-[16/8] w-full rounded-2xl object-cover"
      >
      <div
        v-else
        class="mb-6 flex aspect-[16/8] items-center justify-center rounded-2xl bg-tint text-[13px] text-ink-400"
      >
        [Cover photo]
      </div>
      <p class="m-0 mb-4 text-lg leading-[1.7] font-medium">
        {{ post.summary }}
      </p>
      <p class="m-0 mb-7 text-[17px] leading-[1.7] whitespace-pre-line text-ink-700">
        {{ post.body }}
      </p>
      <div class="flex flex-wrap items-center justify-between gap-3.5 rounded-[14px] border border-[#F4D78C] bg-note px-5.5 py-4.5">
        <span class="font-semibold">Ready to train with us?</span>
        <UButton
          to="/register"
          label="Enroll now"
        />
      </div>
    </article>
  </section>
</template>
