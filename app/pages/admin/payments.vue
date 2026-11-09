<script setup lang="ts">
import type { Paginated, Payment } from '~/types'

definePageMeta({ layout: 'admin', middleware: ['sanctum:auth', 'role'], roles: ['staff', 'admin'] })
useSeoMeta({ title: 'Payment verification' })

const api = useApi()
const admin = useAdminStore()
const toast = useToast()
const { report } = useApiError()

const filter = ref<'paid' | 'verified' | 'all'>('paid')
const page = ref(1)
const result = ref<Paginated<Payment> | null>(null)
const busy = ref<number | null>(null)
const rejecting = ref<Payment | null>(null)
const reason = ref('')

const filters = [
  { key: 'paid' as const, label: 'To verify' },
  { key: 'verified' as const, label: 'Verified' },
  { key: 'all' as const, label: 'All' }
]

async function load() {
  try {
    result.value = await api.raw<Paginated<Payment>>('/admin/payments', { status: filter.value, page: page.value })
  } catch (e) {
    report(e, 'Couldn’t load payments')
  }
}

watch([filter, page], load, { immediate: true })
watch(filter, () => {
  page.value = 1
})

async function verify(p: Payment) {
  busy.value = p.id
  try {
    await api.post(`/admin/payments/${p.id}/verify`)
    toast.add({ title: `Payment verified — ${p.student?.full_name} ${peso(p.amount)}`, description: 'Email and SMS sent to the student.', color: 'success', icon: 'i-lucide-check' })
    await Promise.all([load(), admin.refreshOverview()])
  } catch (e) {
    report(e, 'Not verified')
  } finally {
    busy.value = null
  }
}

async function confirmReject() {
  if (!rejecting.value) return
  const p = rejecting.value
  busy.value = p.id
  try {
    await api.post(`/admin/payments/${p.id}/reject`, { reason: reason.value || null })
    toast.add({ title: `Payment rejected — ${p.student?.full_name}`, description: 'Email and SMS sent to the student.', color: 'neutral', icon: 'i-lucide-x' })
    rejecting.value = null
    reason.value = ''
    await Promise.all([load(), admin.refreshOverview()])
  } catch (e) {
    report(e, 'Not rejected')
  } finally {
    busy.value = null
  }
}

function courses(p: Payment) {
  return (p.allocations ?? []).map(a => a.course_name).join(', ')
}

function kind(p: Payment) {
  return [...new Set((p.allocations ?? []).map(a => a.amount_type_label))].join(', ')
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Payment verification"
      subtitle="Match the reference no. and amount against your GCash, Maya, PayMongo or bank records before verifying."
    />
    <section class="card overflow-hidden rounded-[14px]">
      <div class="flex flex-wrap gap-2 px-3.5 py-3">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="chip"
          :class="filter === f.key ? 'chip-on' : ''"
          :aria-pressed="filter === f.key"
          @click="filter = f.key"
        >
          {{ f.label }}
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl min-w-[900px]">
          <thead>
            <tr class="bg-surface">
              <th>Student</th><th>Course</th><th>Amount</th><th>Type</th><th>Method · Ref</th><th>Receipt</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in result?.data"
              :key="p.id"
            >
              <td>
                <strong>{{ p.student?.full_name }}</strong>
                <div class="text-xs text-ink-600">
                  {{ longDate(p.paid_at ?? p.created_at) }}
                </div>
              </td>
              <td class="text-[13px]">
                {{ courses(p) }}
              </td>
              <td class="font-bold">
                {{ peso(p.amount) }}
              </td>
              <td class="text-[13px]">
                {{ kind(p) }}
              </td>
              <td class="text-[13px]">
                {{ p.method_label }}<div class="text-ink-600 break-all">
                  {{ p.provider_reference ?? '—' }}
                </div>
              </td>
              <td class="text-[13px] font-semibold">
                {{ p.reference_no }}
              </td>
              <td>
                <UiStatusPill
                  :code="p.status"
                  :label="p.status === 'paid' ? 'Pending' : p.status_label"
                />
              </td>
              <td class="text-right">
                <span
                  v-if="p.status === 'paid'"
                  class="inline-flex gap-1.5"
                >
                  <UButton
                    color="success"
                    size="md"
                    label="Verify"
                    :loading="busy === p.id"
                    @click="verify(p)"
                  />
                  <UButton
                    variant="ghost"
                    size="md"
                    label="Reject"
                    @click="rejecting = p"
                  />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="result && !result.data.length"
        class="m-0 p-6 text-center text-ink-600"
      >
        {{ filter === 'paid' ? 'Nothing to verify — all caught up.' : 'No payments yet.' }}
      </p>
      <div
        v-if="result && result.meta.last_page > 1"
        class="flex justify-end px-3.5 py-3"
      >
        <UPagination
          v-model:page="page"
          :total="result.meta.total"
          :items-per-page="result.meta.per_page"
        />
      </div>
    </section>

    <UModal
      :open="!!rejecting"
      title="Reject payment"
      :description="rejecting ? `${rejecting.reference_no} · ${peso(rejecting.amount)} from ${rejecting.student?.full_name}` : ''"
      @update:open="(v: boolean) => { if (!v) rejecting = null }"
    >
      <template #body>
        <UFormField
          label="Reason (sent to the student)"
          help="e.g. Reference number not found in our records"
        >
          <UTextarea
            v-model="reason"
            :rows="3"
            class="w-full"
          />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            variant="outline"
            color="neutral"
            label="Cancel"
            @click="rejecting = null"
          />
          <UButton
            label="Reject payment"
            :loading="!!rejecting && busy === rejecting.id"
            @click="confirmReject"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
