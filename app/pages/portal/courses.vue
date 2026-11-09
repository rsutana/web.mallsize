<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['sanctum:auth', 'role'], roles: ['student'] })
useSeoMeta({ title: 'My courses' })

const portal = usePortalStore()
const { report } = useApiError()

onMounted(() => {
  portal.refresh().catch(e => report(e, 'Couldn’t load your courses'))
})

const rows = computed(() => portal.enrollments.filter(e => e.status === 'enrolled'))

function batchLeft(sets: { slots_left: number }[] | undefined) {
  return (sets ?? []).reduce((a, s) => a + s.slots_left, 0)
}
</script>

<template>
  <div>
    <h1 class="m-0 mb-4.5 text-[26px] font-semibold">
      My enrolled courses
    </h1>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
      <article
        v-for="e in rows"
        :key="e.id"
        class="card flex flex-col gap-3 p-5.5"
      >
        <div class="flex items-start justify-between gap-2.5">
          <h2 class="m-0 text-lg font-semibold">
            {{ e.course?.name }}
          </h2>
          <UiStatusPill
            :code="e.payment_status"
            :label="e.payment_status_label"
          />
        </div>
        <dl class="m-0 grid grid-cols-2 gap-2.5 text-sm">
          <div>
            <dt class="text-xs text-ink-600">
              Batch
            </dt><dd class="mt-0.5 font-semibold">
              {{ e.batch?.name }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-ink-600">
              Your set
            </dt><dd class="mt-0.5 font-semibold">
              {{ e.set?.name }}
            </dd>
          </div>
          <div class="col-span-2">
            <dt class="text-xs text-ink-600">
              Schedule
            </dt><dd class="mt-0.5 font-semibold">
              Approx. {{ longDate(e.set?.start_date) }} – {{ longDate(e.set?.end_date) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-ink-600">
              Training days
            </dt><dd class="mt-0.5 font-semibold">
              {{ e.set?.training_days }} days · {{ e.set?.time_label }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-ink-600">
              Location
            </dt><dd class="mt-0.5 font-semibold">
              {{ e.location?.name }}, {{ e.location?.city }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-ink-600">
              Balance
            </dt><dd class="mt-0.5 font-bold text-brand-600">
              {{ peso(e.balance) }}
            </dd>
          </div>
        </dl>
        <section
          :aria-label="`Sets in ${e.batch?.name}`"
          class="@container border-t border-[#F0E6E3] pt-3"
        >
          <div class="mb-2 flex flex-wrap justify-between gap-2">
            <strong class="text-[13px]">Sets in {{ e.batch?.name.split(' — ')[0] }}</strong>
            <span class="text-xs text-ink-600">{{ batchLeft(e.batch?.sets) === 0 ? 'Batch fully booked' : `${batchLeft(e.batch?.sets)} slots left in this batch` }}</span>
          </div>
          <!-- Two columns once the card is wide enough (container query), one on narrow cards. -->
          <ul class="m-0 grid list-none grid-cols-1 gap-2.5 p-0 @xl:grid-cols-2">
            <li
              v-for="s in e.batch?.sets"
              :key="s.id"
              class="rounded-[10px] border p-3 text-[13px]"
              :class="s.id === e.set?.id ? 'border-brand-600 bg-[#FFF8F7]' : 'border-[#E7DDDA] bg-white'"
            >
              <div class="flex items-start justify-between gap-2.5">
                <span>
                  <strong>{{ s.name }}</strong>
                  <span
                    v-if="s.id === e.set?.id"
                    class="ml-1.5 rounded-full bg-brand-600 px-2 py-px text-[11px] font-bold text-white"
                  >Your set</span>
                  · {{ shortDate(s.start_date) }} – {{ shortDate(s.end_date) }} · {{ s.training_days }} days
                </span>
                <span
                  class="font-semibold whitespace-nowrap"
                  :class="slotTone(s.slots_left).text"
                >{{ s.slots_left === 0 ? 'Full' : `${s.slots_left} left` }}</span>
              </div>
              <div class="mt-0.5 text-xs text-ink-600">
                {{ s.time_label }}
              </div>
              <div class="mt-1.5 flex items-center gap-2">
                <UiSlotBar
                  class="flex-1"
                  :taken="s.slots_taken"
                  :slots="s.slots"
                />
                <span class="text-xs whitespace-nowrap text-ink-600">{{ s.slots_taken }}/{{ s.slots }} enrolled</span>
              </div>
            </li>
          </ul>
        </section>
        <UButton
          v-if="e.balance > 0"
          :to="{ path: '/portal/payments', query: { select: String(e.id) } }"
          label="Pay balance"
        />
      </article>
    </div>
    <p
      v-if="!rows.length && !portal.loading"
      class="text-ink-600"
    >
      You’re not enrolled in any course yet.
    </p>
    <p class="mt-4.5 text-sm text-ink-600">
      Want to add another course? <NuxtLink to="/register">
        Enroll in more courses
      </NuxtLink>
    </p>
  </div>
</template>
