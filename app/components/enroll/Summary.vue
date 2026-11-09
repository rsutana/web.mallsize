<script setup lang="ts">
const props = defineProps<{ payingToday?: number | null }>()
const reg = useRegistrationStore()
const remaining = computed(() => reg.totalFee - (props.payingToday ?? 0))
</script>

<template>
  <aside class="flex-[1_1_300px] rounded-2xl border border-line bg-white p-5.5">
    <h2 class="m-0 mb-3.5 text-[17px] font-semibold">
      Enrollment summary
    </h2>
    <div
      v-if="reg.location"
      class="mb-3.5 rounded-[10px] bg-surface px-3 py-2.5 text-[13px]"
    >
      <span class="text-ink-600">Training location</span>
      <strong class="block">{{ reg.location.name }}</strong>
      <span class="text-ink-600">{{ reg.location.city }}</span>
    </div>
    <p
      v-if="!reg.selected.length"
      class="m-0 text-sm text-ink-500"
    >
      No courses selected yet.
    </p>
    <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
      <li
        v-for="s in reg.selected"
        :key="s.course.id"
        class="flex justify-between gap-2.5 text-sm"
      >
        <span>{{ s.course.name }}<span class="block text-xs text-ink-600">{{ s.batchName.split(' — ')[0] }} · {{ s.set.name }} · {{ shortDate(s.set.start_date) }} – {{ shortDate(s.set.end_date) }}</span></span>
        <strong>{{ peso(s.course.fee) }}</strong>
      </li>
    </ul>
    <div class="mt-3.5 flex flex-col gap-1.5 border-t border-dashed border-line-strong pt-3.5 text-sm">
      <div class="flex justify-between">
        <span>Total course fees</span><strong class="text-lg text-brand-600">{{ peso(reg.totalFee) }}</strong>
      </div>
      <div class="flex justify-between text-ink-600">
        <span>Minimum down payment</span><span>{{ peso(reg.totalDownPayment) }}</span>
      </div>
      <template v-if="payingToday != null && reg.selected.length">
        <div class="mt-1.5 flex justify-between border-t border-line pt-2">
          <strong>Paying today</strong><strong>{{ peso(payingToday) }}</strong>
        </div>
        <div class="flex justify-between text-ink-600">
          <span>Remaining balance</span><span>{{ peso(remaining) }}</span>
        </div>
      </template>
    </div>
    <p class="mt-3.5 mb-0 text-xs leading-normal text-ink-500">
      Pay with Maya, QR Ph, GCash, ShopeePay or a debit/credit card. The remaining balance is payable when your training starts.
    </p>
  </aside>
</template>
