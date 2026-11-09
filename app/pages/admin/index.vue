<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['sanctum:auth', 'role'], roles: ['staff', 'admin'] })
useSeoMeta({ title: 'Overview' })

const admin = useAdminStore()
const api = useApi()
const toast = useToast()
const { report } = useApiError()
const reminding = ref(false)

onMounted(() => {
  admin.refreshOverview().catch(e => report(e, 'Couldn’t load the overview'))
})

const o = computed(() => admin.overview)
const openCourses = computed(() => o.value?.courses.filter(c => c.status === 'open').length ?? 0)

async function remindAll() {
  reminding.value = true
  try {
    const res = await api.post<{ students_reminded: number }>('/admin/balance-reminders')
    toast.add({ title: `Balance reminders sent to ${res.students_reminded} students`, description: 'Email and SMS were sent.', color: 'success', icon: 'i-lucide-send' })
    await admin.refreshOverview()
  } catch (e) {
    report(e, 'Reminders not sent')
  } finally {
    reminding.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="m-0 mb-4.5 text-2xl font-semibold">
      Overview
    </h1>
    <div class="mb-4.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
      <NuxtLink
        to="/admin/payments"
        class="card rounded-[14px] p-4 text-left text-ink-900 no-underline hover:border-brand-600"
      >
        <div class="text-[13px] text-ink-600">Payments to verify</div>
        <div class="text-[28px] font-bold text-brand-600">{{ o?.payments_to_verify ?? '—' }}</div>
      </NuxtLink>
      <AdminStatCard
        label="Courses"
        :value="o?.courses.length ?? '—'"
        :sub="o ? `${openCourses} open for enrollment` : undefined"
      />
      <AdminStatCard
        label="Enrolled (course slots)"
        :value="o?.enrolled_count ?? '—'"
      />
      <AdminStatCard
        label="Collected (paid & verified)"
        :value="peso(o?.collected)"
      />
      <AdminStatCard
        label="Outstanding balances"
        :value="peso(o?.outstanding)"
      />
    </div>
    <section class="card mb-4.5 rounded-[14px]">
      <h2 class="m-0 px-4 pt-3.5 text-base font-semibold">
        Courses, batches &amp; slots
      </h2>
      <p class="m-0 px-4 pb-3 text-[13px] text-ink-600">
        Enrolled students and remaining slots per batch and set. Registrations awaiting payment hold a slot for 30 minutes.
      </p>
      <div class="flex flex-col gap-3 border-t border-line bg-surface px-3.5 pt-3 pb-4">
        <div
          v-for="c in o?.courses"
          :key="c.id"
        >
          <div class="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <div class="flex items-center gap-2">
              <strong class="text-[15px]">{{ c.name }}</strong>
              <UiStatusPill
                :code="c.status"
                :label="c.status_label"
              />
            </div>
            <div class="text-[13px] text-ink-600">
              <strong class="text-ink-900">{{ c.enrolled_count }}</strong> enrolled
              <template v-if="c.pending_count">
                · {{ c.pending_count }} awaiting payment
              </template>
              · <strong :class="slotTone(c.slots_left).text">{{ c.slots_left }}</strong> of {{ c.slots }} slots left
              · {{ c.batches.length }} {{ c.batches.length === 1 ? 'batch' : 'batches' }}
            </div>
          </div>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-2.5">
            <AdminBatchCard
              v-for="b in c.batches"
              :key="b.id"
              :batch="b"
            />
          </div>
          <p
            v-if="!c.batches.length"
            class="m-0 text-[13px] text-ink-600"
          >
            No batches yet.
          </p>
        </div>
      </div>
      <p
        v-if="o && !o.courses.length"
        class="m-0 px-4 py-4 text-sm text-ink-600"
      >
        No courses yet.
      </p>
    </section>
    <div class="flex flex-wrap items-start gap-4">
      <section class="card min-w-0 flex-[999_1_420px] rounded-[14px]">
        <h2 class="m-0 px-4 py-3.5 text-base font-semibold">
          Down payment only — training starts soon
        </h2>
        <div class="overflow-x-auto">
          <table class="tbl min-w-[520px]">
            <thead>
              <tr class="bg-surface">
                <th>Student</th><th>Course</th><th>Starts</th><th>Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="d in o?.due_soon"
                :key="d.id"
              >
                <td>
                  <strong>{{ d.student?.full_name }}</strong>
                  <div class="text-xs text-ink-600">
                    {{ d.student?.mobile }}
                  </div>
                </td>
                <td>{{ d.course?.name }}</td>
                <td>{{ longDate(d.set?.start_date) }}</td>
                <td class="font-bold text-brand-600">
                  {{ peso(d.balance) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          v-if="o && !o.due_soon.length"
          class="m-0 px-4 py-4 text-sm text-ink-600"
        >
          No upcoming students with a remaining balance.
        </p>
        <div class="px-4 py-3">
          <UButton
            variant="outline"
            color="neutral"
            label="Send balance reminder (email + SMS)"
            icon="i-lucide-send"
            :loading="reminding"
            :disabled="!o?.due_soon.length"
            @click="remindAll"
          />
        </div>
      </section>
      <section class="card flex-[1_1_300px] rounded-[14px]">
        <h2 class="m-0 px-4 py-3.5 text-base font-semibold">
          Notifications sent
        </h2>
        <ul class="m-0 list-none p-0 pb-1.5">
          <li
            v-for="l in o?.notifications"
            :key="l.id"
            class="border-t border-[#F3EEEC] px-4 py-2.5 text-[13px]"
          >
            <div class="font-semibold">
              {{ l.title }}
            </div>
            <div class="text-ink-600">
              {{ l.channels }} · {{ longDate(l.sent_at) }}
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
