<script setup lang="ts">
import type { Enrollment } from '~/types'

definePageMeta({ layout: 'portal', middleware: ['sanctum:auth', 'role'], roles: ['student'] })
useSeoMeta({ title: 'Dashboard' })

const portal = usePortalStore()
const route = useRoute()
const { user } = useCurrentUser()
const { report } = useApiError()

const welcome = ref(route.query.welcome === '1')
const filter = ref<'all' | 'paid' | 'unpaid'>('all')
const checked = ref<number[]>([])

onMounted(() => {
  portal.refresh().catch(e => report(e, 'Couldn’t load your dashboard'))
})

const d = computed(() => portal.dashboard)
const enrollments = computed(() => (d.value?.enrollments ?? []).filter(e => e.status === 'enrolled'))
const paid = computed(() => enrollments.value.filter(e => e.balance === 0))
const unpaid = computed(() => enrollments.value.filter(e => e.balance > 0))
const pendingReservations = computed(() => (d.value?.enrollments ?? []).filter(e => e.status === 'pending_payment'))
const alerts = computed(() => enrollments.value.filter(e => e.payment_status === 'down_payment_only'))
const rows = computed<Enrollment[]>(() => (filter.value === 'paid' ? paid.value : filter.value === 'unpaid' ? unpaid.value : enrollments.value))
const showBulk = computed(() => filter.value === 'unpaid' && unpaid.value.length > 0)
const sum = (list: Enrollment[], k: 'fee' | 'amount_paid' | 'balance') => list.reduce((a, e) => a + e[k], 0)
const checkedTotal = computed(() => unpaid.value.filter(e => checked.value.includes(e.id)).reduce((a, e) => a + e.balance, 0))

const filters = computed(() => [
  { key: 'all' as const, label: 'All', count: enrollments.value.length },
  { key: 'paid' as const, label: 'Paid', count: paid.value.length },
  { key: 'unpaid' as const, label: 'Unpaid (Down payment)', count: unpaid.value.length }
])

function toggle(id: number) {
  checked.value = checked.value.includes(id) ? checked.value.filter(x => x !== id) : [...checked.value, id]
}

function toggleAll() {
  checked.value = checked.value.length === unpaid.value.length ? [] : unpaid.value.map(e => e.id)
}

function payFor(ids: number[]) {
  return navigateTo({ path: '/portal/payments', query: { select: ids.join(',') } })
}
</script>

<template>
  <div>
    <div
      v-if="welcome"
      role="status"
      class="mb-4.5 flex items-start gap-3.5 rounded-[14px] border-[1.5px] border-[#9DD3AE] bg-ok-bg px-4.5 py-4 text-[#123F22]"
    >
      <span
        aria-hidden="true"
        class="flex size-9 flex-none items-center justify-center rounded-full bg-ok"
      ><UIcon
        name="i-lucide-check"
        class="size-5 text-white"
      /></span>
      <div class="flex-1">
        <strong class="block text-base">Payment successful — you’re enrolled!</strong>
        <span class="text-sm">We received your payment. A receipt was sent to your email and mobile number. The remaining balance is payable when your training starts.</span>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        aria-label="Dismiss"
        @click="welcome = false"
      />
    </div>

    <h1 class="m-0 mb-1 text-[26px] font-semibold">
      Hi, {{ user?.student?.first_name ?? user?.name }}
    </h1>
    <p class="mt-0 mb-5.5 text-ink-600">
      Here’s where your enrollment stands.
    </p>

    <div
      v-for="e in pendingReservations"
      :key="`p${e.id}`"
      role="alert"
      class="mb-3.5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[14px] border-[1.5px] border-[#B8C7E3] bg-info-bg px-4.5 py-4"
    >
      <UIcon
        name="i-lucide-clock"
        class="size-6 text-info"
      />
      <div class="flex-[1_1_320px]">
        <strong>Slot reserved — {{ e.course?.name }}</strong>
        <div class="text-sm text-info">
          Pay the down payment of <strong>{{ peso(e.min_down_payment) }}</strong> to confirm your enrollment.
        </div>
      </div>
      <UButton
        label="Pay down payment"
        @click="payFor([e.id])"
      />
    </div>

    <div
      v-for="a in alerts"
      :key="a.id"
      role="alert"
      class="mb-3.5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[14px] border-[1.5px] border-note-line bg-note px-4.5 py-4"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="size-6 text-warn"
      />
      <div class="flex-[1_1_320px]">
        <strong>Down payment only — {{ a.course?.name }}</strong>
        <div class="text-sm text-[#4A3A1A]">
          Please settle the remaining <strong>{{ peso(a.balance) }}</strong> before your first training day on <strong>{{ longDate(a.set?.start_date) }}</strong> ({{ daysUntil(a.set?.start_date) }} days left).
        </div>
      </div>
      <UButton
        label="Pay remaining"
        @click="payFor([a.id])"
      />
    </div>

    <div class="mb-5.5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
      <div class="rounded-2xl border border-brand-600 bg-brand-600 p-4.5 text-white">
        <div class="text-[13px] text-[#FFE0E0]">
          Overall remaining balance
        </div>
        <div class="mt-1 text-[30px] font-bold">
          {{ peso(d?.total_balance) }}
        </div>
      </div>
      <div class="card p-4.5">
        <div class="text-[13px] text-ink-600">
          Total paid
        </div>
        <div class="mt-1 text-[26px] font-bold">
          {{ peso(d?.total_paid) }}
        </div>
      </div>
      <div class="card p-4.5">
        <div class="text-[13px] text-ink-600">
          Courses enrolled
        </div>
        <div class="mt-1 text-[26px] font-bold">
          {{ d?.courses_count ?? 0 }}
        </div>
        <div class="text-[13px] text-ink-600">
          {{ d?.fully_paid_count ?? 0 }} fully paid · {{ d?.with_balance_count ?? 0 }} with balance
        </div>
      </div>
      <div class="card p-4.5">
        <div class="text-[13px] text-ink-600">
          Next training
        </div>
        <div class="mt-1 text-xl font-bold">
          {{ d?.next_training ? longDate(d.next_training.start_date) : '—' }}
        </div>
        <div class="text-[13px] text-ink-600">
          {{ d?.next_training?.course_name }}
        </div>
      </div>
    </div>

    <section class="card pt-1.5 pb-1">
      <div class="flex flex-wrap items-center justify-between gap-3 px-4.5 pt-3.5 pb-2">
        <h2 class="m-0 text-lg font-semibold">
          Balances per course
        </h2>
        <UButton
          to="/portal/payments"
          variant="outline"
          label="Make a payment"
        />
      </div>
      <div
        role="tablist"
        aria-label="Filter courses by payment"
        class="flex flex-wrap gap-2 px-4.5 pt-1 pb-3"
      >
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          role="tab"
          :aria-selected="filter === f.key"
          class="chip"
          :class="filter === f.key ? 'chip-on' : ''"
          @click="filter = f.key"
        >
          {{ f.label }}
          <span
            class="rounded-full px-1.5 py-px text-[11px] font-bold"
            :class="filter === f.key ? 'bg-brand-600 text-white' : 'bg-[#F3EEEC] text-ink-700'"
          >{{ f.count }}</span>
        </button>
      </div>
      <div
        v-if="showBulk"
        class="mx-4.5 mb-2.5 flex flex-wrap items-center justify-between gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 py-2.5"
      >
        <UCheckbox
          :model-value="checked.length === unpaid.length"
          :label="checked.length ? `${checked.length} of ${unpaid.length} selected` : 'Select all unpaid courses'"
          @update:model-value="toggleAll"
        />
        <UButton
          :disabled="!checked.length"
          :label="`Pay selected · ${peso(checkedTotal)}`"
          @click="payFor(checked)"
        />
      </div>
      <div class="overflow-x-auto">
        <table class="tbl min-w-[640px]">
          <thead>
            <tr>
              <th
                v-if="showBulk"
                class="w-11"
              >
                <span class="sr-only">Select</span>
              </th>
              <th>Course</th>
              <th>Fee</th>
              <th>Paid</th>
              <th class="w-[22%]">
                Progress
              </th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in rows"
              :key="e.id"
              :class="showBulk && checked.includes(e.id) ? 'bg-[#FFF8F7]' : ''"
            >
              <td v-if="showBulk">
                <input
                  type="checkbox"
                  class="size-5 accent-brand-600"
                  :checked="checked.includes(e.id)"
                  :aria-label="`Select ${e.course?.name}`"
                  @change="toggle(e.id)"
                >
              </td>
              <td>
                <strong>{{ e.course?.name }}</strong>
                <div class="text-xs text-ink-600">
                  {{ e.batch?.name.split(' — ')[0] }} · {{ e.set?.name }} · starts approx. {{ longDate(e.set?.start_date) }}
                </div>
              </td>
              <td>{{ peso(e.fee) }}</td>
              <td>{{ peso(e.amount_paid) }}</td>
              <td>
                <div class="h-2 overflow-hidden rounded-full bg-[#F3EEEC]">
                  <div
                    class="h-full"
                    :class="e.balance === 0 ? 'bg-ok' : 'bg-brand-600'"
                    :style="{ width: `${Math.round(e.amount_paid / e.fee * 100)}%` }"
                  />
                </div>
                <div class="mt-1 text-xs text-ink-600">
                  {{ Math.round(e.amount_paid / e.fee * 100) }}% paid
                </div>
              </td>
              <td>
                <strong :class="e.balance > 0 ? 'text-brand-600' : 'text-ok'">{{ peso(e.balance) }}</strong>
              </td>
              <td>
                <UiStatusPill
                  :code="e.payment_status"
                  :label="e.payment_status_label"
                />
              </td>
            </tr>
          </tbody>
          <tfoot v-if="rows.length">
            <tr>
              <td v-if="showBulk" />
              <td class="font-bold">
                {{ filter === 'all' ? 'Overall' : 'Total' }}
              </td>
              <td class="font-semibold">
                {{ peso(sum(rows, 'fee')) }}
              </td>
              <td class="font-semibold">
                {{ peso(sum(rows, 'amount_paid')) }}
              </td>
              <td />
              <td class="font-bold text-brand-600">
                {{ peso(sum(rows, 'balance')) }}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p
        v-if="!rows.length"
        class="m-0 px-4.5 py-5 text-center text-ink-600"
      >
        {{ filter === 'paid' ? 'No fully paid courses yet.' : filter === 'unpaid' ? 'No unpaid balances — you’re all set.' : 'You’re not enrolled in any course yet.' }}
        <NuxtLink
          v-if="filter === 'all'"
          to="/register"
        >Enroll now</NuxtLink>
      </p>
    </section>
  </div>
</template>
