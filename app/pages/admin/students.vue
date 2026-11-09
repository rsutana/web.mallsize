<script setup lang="ts">
import type { Course, Enrollment, Paginated } from '~/types'

definePageMeta({ layout: 'admin', middleware: ['sanctum:auth', 'role'], roles: ['staff', 'admin'] })
useSeoMeta({ title: 'Enrolled students' })

const api = useApi()
const lookups = useLookups()
const { report } = useApiError()

const courses = ref<Course[]>([])
const filters = reactive({ course_id: 'all', batch_id: 'all', payment_status: 'all', q: '' })
const PER_PAGE = 15
const page = ref(1)
const result = ref<Paginated<Enrollment> | null>(null)
const total = ref(0)

onMounted(async () => {
  await lookups.load()
  courses.value = await api.get<Course[]>('/courses').catch(() => [])
  const all = await api.raw<Paginated<Enrollment>>('/admin/enrollments', { per_page: 5 }).catch(() => null)
  total.value = all?.meta.total ?? 0
})

const query = computed(() => ({
  course_id: filters.course_id === 'all' ? undefined : filters.course_id,
  batch_id: filters.batch_id === 'all' ? undefined : filters.batch_id,
  payment_status: filters.payment_status === 'all' ? undefined : filters.payment_status,
  q: filters.q || undefined
}))

const courseItems = computed(() => [{ label: 'All courses', value: 'all' }, ...courses.value.map(c => ({ label: c.name, value: String(c.id) }))])
const batchItems = computed(() => [
  { label: 'All batches', value: 'all' },
  ...courses.value
    .filter(c => filters.course_id === 'all' || String(c.id) === filters.course_id)
    .flatMap(c => (c.batches ?? []).map(b => ({ label: (filters.course_id === 'all' ? `${c.name} · ` : '') + b.name, value: String(b.id) })))
])
const statusItems = computed(() => [{ label: 'All', value: 'all' }, ...lookups.items('enrollment_payment_statuses')])

let timer: ReturnType<typeof setTimeout> | undefined
async function load() {
  try {
    result.value = await api.raw<Paginated<Enrollment>>('/admin/enrollments', { ...query.value, page: page.value, per_page: PER_PAGE })
  } catch (e) {
    report(e, 'Couldn’t load students')
  }
}

watch(() => filters.course_id, () => {
  filters.batch_id = 'all'
})
watch([query, page], () => {
  clearTimeout(timer)
  timer = setTimeout(load, 250)
}, { immediate: true })
watch(query, () => {
  page.value = 1
})

const exportAllUrl = computed(() => api.absolute('/admin/enrollments/export'))
const exportFilteredUrl = computed(() => api.absolute('/admin/enrollments/export', query.value))
</script>

<template>
  <div>
    <AdminPageHeader
      title="Enrolled students"
      :subtitle="result ? `${result.meta.total} of ${total} enrollments shown` : ''"
    >
      <template #actions>
        <UButton
          :to="exportAllUrl"
          external
          target="_blank"
          variant="outline"
          color="neutral"
          icon="i-lucide-download"
          label="Export all (CSV)"
        />
        <UButton
          :to="exportFilteredUrl"
          external
          target="_blank"
          icon="i-lucide-download"
          label="Export filtered"
        />
      </template>
    </AdminPageHeader>
    <section class="card overflow-hidden rounded-[14px]">
      <div class="flex flex-wrap items-end gap-3 p-3.5">
        <UFormField
          label="Course"
          class="flex-[1_1_220px]"
        >
          <USelect
            v-model="filters.course_id"
            :items="courseItems"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Batch"
          class="flex-[1_1_220px]"
        >
          <USelect
            v-model="filters.batch_id"
            :items="batchItems"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Payment status"
          class="flex-[1_1_180px]"
        >
          <USelect
            v-model="filters.payment_status"
            :items="statusItems"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Search"
          class="flex-[2_1_240px]"
        >
          <UInput
            v-model="filters.q"
            type="search"
            icon="i-lucide-search"
            placeholder="Name, email or reference no."
            class="w-full"
          />
        </UFormField>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl min-w-[1040px]">
          <thead>
            <tr class="bg-surface">
              <th>Student</th><th>Course</th><th>Batch</th><th>Set &amp; schedule</th><th>Location</th><th>Fee</th><th>Paid</th><th>Balance</th><th>Payment</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in result?.data"
              :key="e.id"
            >
              <td>
                <strong>{{ e.student?.full_name }}</strong>
                <div class="text-xs text-ink-600">
                  {{ e.student?.reference_no }} · {{ e.student?.mobile }}
                </div>
              </td>
              <td class="text-[13px]">
                {{ e.course?.name }}
              </td>
              <td class="text-[13px]">
                <strong>{{ e.batch?.name.split(' — ')[0] }}</strong>
                <div class="text-ink-600">
                  {{ e.batch?.name.split(' — ')[1] }}
                </div>
              </td>
              <td class="text-[13px]">
                <span class="inline-block rounded-full bg-brand-50 px-2 py-px text-xs font-semibold text-brand-700">{{ e.set?.name }}</span>
                <div class="mt-0.5 whitespace-nowrap text-ink-600">
                  Approx. {{ dateRange(e.set?.start_date, e.set?.end_date) }}
                </div>
                <div class="text-ink-600">
                  {{ e.set?.time_label }}
                </div>
              </td>
              <td class="text-[13px]">
                {{ e.location?.name }}
              </td>
              <td>{{ peso(e.fee) }}</td>
              <td>{{ peso(e.amount_paid) }}</td>
              <td
                class="font-bold"
                :class="e.balance ? 'text-brand-600' : 'text-ok'"
              >
                {{ peso(e.balance) }}
              </td>
              <td>
                <UiStatusPill
                  :code="e.payment_status"
                  :label="e.payment_status_label"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="result && !result.data.length"
        class="m-0 p-6 text-center text-ink-600"
      >
        No students match these filters.
      </p>
      <AdminPaginationFooter
        v-if="result"
        v-model:page="page"
        :meta="result.meta"
      />
    </section>
  </div>
</template>
