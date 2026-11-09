<script setup lang="ts">
import type { Enrollment } from '~/types'
import type { CardDetails, CheckoutItem } from '~/composables/useCheckout'

definePageMeta({ layout: 'portal', middleware: ['sanctum:auth', 'role'], roles: ['student'] })
useSeoMeta({ title: 'Payments' })

const portal = usePortalStore()
const route = useRoute()
const toast = useToast()
const checkout = useCheckout()
const { report, friendlyError } = useApiError()

const MIN_PARTIAL = 100_000

const selectedIds = ref<number[]>([])
const mode = ref<'full' | 'custom'>('full')
const customPesos = ref<number | undefined>()
const processing = ref(false)
const processingText = ref('')
const qrImage = ref<string | null>(null)
const methods = useTemplateRef('methods')

onMounted(async () => {
  await portal.refresh().catch(e => report(e, 'Couldn’t load your payments'))
  const fromQuery = String(route.query.select ?? '').split(',').map(Number).filter(id => payable.value.some(e => e.id === id))
  selectedIds.value = fromQuery.length ? fromQuery : payable.value.slice(0, 1).map(e => e.id)
})

const payable = computed(() => portal.enrollments.filter(e => e.balance > 0 && (e.status === 'enrolled' || e.status === 'pending_payment')))
const selected = computed(() => payable.value.filter(e => selectedIds.value.includes(e.id)))
const single = computed(() => (selected.value.length === 1 ? selected.value[0] : undefined))
const multi = computed(() => selected.value.length > 1)

function minimumFor(e: Enrollment) {
  return e.amount_paid === 0 ? Math.min(e.min_down_payment, e.balance) : Math.min(MIN_PARTIAL, e.balance)
}

const amount = computed(() => {
  if (multi.value) return selected.value.reduce((a, e) => a + e.balance, 0)
  if (!single.value) return 0
  return mode.value === 'full' ? single.value.balance : toCentavos(customPesos.value)
})

const amountWarning = computed(() => {
  if (!single.value || mode.value !== 'custom' || customPesos.value === undefined) return ''
  const min = minimumFor(single.value)
  return amount.value < min || amount.value > single.value.balance ? `Enter an amount between ${peso(min)} and ${peso(single.value.balance)}.` : ''
})

const blocked = computed(() => !selected.value.length || amount.value <= 0 || !!amountWarning.value)

function note(e: Enrollment) {
  return e.amount_paid === 0
    ? `${e.course?.name}: must have a down payment of ${peso(e.min_down_payment)} and the remaining ${peso(e.fee - e.min_down_payment)} will be payable upon starting (${longDate(e.set?.start_date)}).`
    : `${e.course?.name}: down payment received. The remaining ${peso(e.balance)} is payable upon starting (${longDate(e.set?.start_date)}).`
}

function toggle(id: number) {
  selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter(x => x !== id) : [...selectedIds.value, id]
  mode.value = 'full'
  customPesos.value = undefined
}

function items(): CheckoutItem[] {
  if (single.value && mode.value === 'custom') {
    return [{ enrollment_id: single.value.id, amount_type: 'custom', amount: amount.value }]
  }
  return selected.value.map(e => ({ enrollment_id: e.id, amount_type: 'full' as const }))
}

async function pay(method: string, card?: CardDetails) {
  if (blocked.value) return
  processing.value = true
  const label = checkout.config.value?.methods.find(m => m.code === method)?.label ?? method
  processingText.value = method === 'card' ? 'Confirming with your bank. Please don’t close this page.' : `Waiting for ${label} to confirm. Please don’t close this page.`
  try {
    const { payment, qr } = await checkout.pay(items(), method, card)
    let result = payment
    if (qr) {
      qrImage.value = qr.image_url ?? null
      result = await checkout.waitForResult(payment.id)
    }
    if (result.status === 'paid' || result.status === 'verified') {
      const names = selected.value.length > 1 ? `${selected.value.length} courses` : selected.value[0]?.course?.name
      toast.add({ title: 'Payment successful', description: `${peso(result.amount)} for ${names} via ${result.method_label}. Receipt ${result.reference_no} was sent to your email and mobile.`, color: 'success', icon: 'i-lucide-check' })
      methods.value?.reset()
      mode.value = 'full'
      customPesos.value = undefined
      await portal.refresh()
      selectedIds.value = payable.value.slice(0, 1).map(e => e.id)
    } else {
      toast.add({ title: 'Payment didn’t go through', description: result.failure_reason ?? 'Please try again or use another method.', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } catch (e) {
    toast.add({ title: 'Payment didn’t go through', description: friendlyError(e), color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    processing.value = false
    qrImage.value = null
  }
}

function courseNames(p: { allocations?: { course_name: string | null }[] }) {
  return (p.allocations ?? []).map(a => a.course_name).filter(Boolean).join(', ')
}
</script>

<template>
  <div>
    <h1 class="m-0 mb-4.5 text-[26px] font-semibold">
      Payments
    </h1>
    <div class="flex flex-wrap items-start gap-4.5">
      <section class="card min-w-0 flex-[999_1_460px] p-5.5">
        <h2 class="m-0 mb-4 text-lg font-semibold">
          Make a payment
        </h2>
        <p
          v-if="!payable.length && !portal.loading"
          class="m-0 rounded-xl bg-ok-bg px-4 py-3.5 text-sm font-medium text-[#123F22]"
        >
          All your courses are fully paid. Nothing more to pay.
        </p>
        <template v-else>
          <fieldset class="m-0 border-0 p-0">
            <legend class="mb-2 text-sm font-medium">
              Courses to pay
            </legend>
            <div class="flex flex-col gap-2">
              <label
                v-for="e in payable"
                :key="e.id"
                class="flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-3.5 py-3"
                :class="selectedIds.includes(e.id) ? 'border-brand-600 bg-brand-50' : 'border-line bg-white'"
              >
                <input
                  type="checkbox"
                  class="mt-0.5 size-5 flex-none accent-brand-600"
                  :checked="selectedIds.includes(e.id)"
                  :disabled="processing"
                  @change="toggle(e.id)"
                >
                <span class="flex flex-1 flex-wrap justify-between gap-x-3.5 gap-y-1">
                  <span><strong class="text-sm">{{ e.course?.name }}</strong><span class="block text-xs text-ink-600">Starts {{ longDate(e.set?.start_date) }} · paid {{ peso(e.amount_paid) }} of {{ peso(e.fee) }}</span></span>
                  <span class="text-right"><strong class="text-brand-600">{{ peso(e.balance) }}</strong><span class="block text-xs text-ink-600">remaining</span></span>
                </span>
              </label>
            </div>
          </fieldset>

          <template v-if="single">
            <p class="mt-4.5 mb-2 text-sm font-medium">
              Amount
            </p>
            <div class="flex flex-wrap gap-2.5">
              <button
                type="button"
                class="min-h-14 flex-[1_1_130px] cursor-pointer rounded-xl border-[1.5px] bg-white px-3 py-2 text-sm font-semibold"
                :class="mode === 'full' ? 'border-brand-600 bg-brand-50 shadow-[inset_0_0_0_2px_#A3161A]' : 'border-line-strong'"
                :aria-pressed="mode === 'full'"
                @click="mode = 'full'"
              >
                Pay remaining<br><span class="text-[13px] font-medium text-ink-600">{{ peso(single.balance) }}</span>
              </button>
              <button
                type="button"
                class="min-h-14 flex-[1_1_130px] cursor-pointer rounded-xl border-[1.5px] bg-white px-3 py-2 text-sm font-semibold"
                :class="mode === 'custom' ? 'border-brand-600 bg-brand-50 shadow-[inset_0_0_0_2px_#A3161A]' : 'border-line-strong'"
                :aria-pressed="mode === 'custom'"
                @click="mode = 'custom'"
              >
                Partial / other amount<br><span class="text-[13px] font-medium text-ink-600">min. {{ peso(minimumFor(single)) }}</span>
              </button>
            </div>
            <UFormField
              v-if="mode === 'custom'"
              label="Amount (₱)"
              class="mt-3"
            >
              <UInputNumber
                v-model="customPesos"
                :min="minimumFor(single) / 100"
                :max="single.balance / 100"
                :step="100"
                class="w-full"
              />
            </UFormField>
          </template>
          <div
            v-if="multi"
            class="mt-3.5 flex flex-wrap justify-between gap-2.5 rounded-xl border-[1.5px] border-brand-600 bg-brand-50 px-4 py-3 text-sm"
          >
            <span>Remaining balance for <strong>{{ selected.length }} courses</strong></span><strong class="text-[17px]">{{ peso(amount) }}</strong>
          </div>
          <p
            v-if="!selected.length"
            role="status"
            class="mt-3 mb-0 text-sm text-ink-600"
          >
            Select at least one course to pay.
          </p>
          <p
            v-if="amountWarning"
            role="alert"
            class="mt-3 mb-0 text-sm text-brand-600"
          >
            {{ amountWarning }}
          </p>
          <div
            v-if="selected.length"
            role="note"
            class="note mt-4"
          >
            <ul class="m-0 flex flex-col gap-1 pl-4.5">
              <li
                v-for="e in selected"
                :key="e.id"
              >
                {{ note(e) }}
              </li>
            </ul>
          </div>
          <div
            v-if="processing"
            class="mt-4"
          >
            <PaymentProcessing
              :text="processingText"
              :qr-image="qrImage"
            />
          </div>
          <PaymentMethods
            ref="methods"
            class="mt-4"
            :amount="amount"
            :disabled="blocked"
            :processing="processing"
            @pay="pay"
          />
        </template>
      </section>

      <section class="card flex-[1_1_340px] py-1.5">
        <h2 class="m-0 px-4.5 py-3.5 text-lg font-semibold">
          Payment history
        </h2>
        <ul class="m-0 list-none p-0">
          <li
            v-for="p in portal.payments"
            :key="p.id"
            class="flex justify-between gap-3 border-t border-[#F3EEEC] px-4.5 py-3"
          >
            <div>
              <div class="text-sm font-semibold">
                {{ peso(p.amount) }} · {{ p.method_label }}
              </div>
              <div class="text-xs text-ink-600">
                {{ courseNames(p) }} · {{ longDate(p.paid_at ?? p.created_at) }} · Receipt {{ p.reference_no }}
              </div>
            </div>
            <UiStatusPill
              :code="p.status"
              :label="p.status === 'verified' || p.status === 'paid' ? 'Paid' : p.status_label"
            />
          </li>
          <li
            v-if="!portal.payments.length"
            class="border-t border-[#F3EEEC] px-4.5 py-4 text-sm text-ink-600"
          >
            No payments yet.
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
