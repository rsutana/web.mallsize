<script setup lang="ts">
import type { Orientation } from '~/types'

useSeoMeta({ title: 'Orientation' })

const api = useApi()
const site = useAppConfig().site
const { data: orientations } = await useAsyncData('orientations', () => api.get<Orientation[]>('/orientations'))
const expanded = ref<Record<number, boolean>>({})

function direct(o: Orientation) {
  return o.is_social_linked && !!o.social_url && o.link_mode === 'direct'
}
</script>

<template>
  <section class="mx-auto max-w-[1240px] px-6 pt-12 pb-16">
    <h1 class="display m-0 mb-2 text-[44px]">
      Orientation
    </h1>
    <p class="mt-0 mb-6 max-w-[680px] text-ink-600">
      Join an orientation before your training starts, or attend an online session to learn about our courses, fees and enrollment.
    </p>
    <div class="flex flex-col gap-4">
      <article
        v-for="o in orientations"
        :key="o.id"
        class="flex flex-wrap items-start gap-x-7 gap-y-5 rounded-2xl border border-line bg-white p-5.5"
      >
        <div
          aria-hidden="true"
          class="w-21 flex-none overflow-hidden rounded-[14px] border border-line text-center"
        >
          <div class="bg-brand-600 py-1 text-[13px] font-semibold tracking-[1px] text-white">
            {{ dateParts(o.date).mon }}
          </div>
          <div class="pt-1.5 pb-0.5 text-[34px] leading-none font-bold">
            {{ dateParts(o.date).day }}
          </div>
          <div class="pb-2 text-xs text-ink-600">
            {{ dateParts(o.date).dow }}
          </div>
        </div>
        <div class="min-w-0 flex-[1_1_360px]">
          <div class="mb-2 flex flex-wrap gap-2">
            <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{{ o.course_name ?? 'All courses' }}</span>
            <span class="rounded-full bg-[#F3EEEC] px-2.5 py-0.5 text-xs font-semibold text-ink-700">{{ o.format_label }}</span>
          </div>
          <h2 class="m-0 mb-1.5 text-xl font-semibold">
            {{ o.title }}
          </h2>
          <p class="m-0 text-sm text-ink-600">
            {{ dateParts(o.date).long }}<template v-if="o.time_label">
              · {{ o.time_label }}
            </template><template v-if="o.venue">
              · {{ o.venue }}
            </template>
          </p>
          <div
            v-if="expanded[o.id]"
            :id="`ori-${o.id}`"
            class="mt-3.5 rounded-xl bg-surface px-4 py-3.5 text-sm leading-relaxed"
          >
            <p class="m-0 mb-2.5">
              {{ o.details }}
            </p>
            <a
              v-if="o.social_url"
              :href="o.social_url"
              target="_blank"
              rel="noopener"
              class="font-semibold"
            >View the announcement on {{ o.social_platform_label }} ↗</a>
          </div>
        </div>
        <div class="flex flex-wrap gap-2.5 self-center">
          <UButton
            v-if="direct(o)"
            :to="o.social_url ?? undefined"
            target="_blank"
            :label="`Open ${o.social_platform_label} post ↗`"
          />
          <UButton
            v-else
            variant="outline"
            :aria-expanded="!!expanded[o.id]"
            :aria-controls="`ori-${o.id}`"
            :label="expanded[o.id] ? 'Hide details' : 'View details'"
            @click="expanded[o.id] = !expanded[o.id]"
          />
        </div>
      </article>
      <p
        v-if="!orientations?.length"
        class="text-ink-600"
      >
        No orientations are scheduled right now. Follow our pages for announcements.
      </p>
    </div>
    <div class="mt-7 flex flex-wrap items-center justify-between gap-3.5 rounded-2xl bg-dark px-6.5 py-5.5 text-white">
      <div>
        <div class="text-[17px] font-bold">
          Follow us for orientation announcements
        </div>
        <div class="text-sm text-ink-300">
          New schedules are posted on our social media pages first.
        </div>
      </div>
      <div class="flex flex-wrap gap-2.5">
        <UButton
          :to="site.facebookUrl"
          target="_blank"
          label="Facebook ↗"
          variant="outline"
          class="border-2 border-white/70 text-white ring-0 hover:bg-white/10"
        />
        <UButton
          :to="site.tiktokUrl"
          target="_blank"
          label="TikTok ↗"
          variant="outline"
          class="border-2 border-white/70 text-white ring-0 hover:bg-white/10"
        />
      </div>
    </div>
  </section>
</template>
