<script setup lang="ts">
import type { Course } from '~/types'

definePageMeta({ layout: 'admin', middleware: ['sanctum:auth', 'role'], roles: ['admin'] })
useSeoMeta({ title: 'Courses' })

const api = useApi()
const lookups = useLookups()
const toast = useToast()
const { report, friendlyError } = useApiError()

const courses = ref<Course[]>([])
const expanded = ref<Record<number, boolean>>({})
const confirmId = ref<number | null>(null)
const open = ref(false)
const saving = ref(false)
const formError = ref('')

interface DraftSet { id?: number, name: string, slots: number, start_date: string, training_days: number, time_label: string, slots_taken: number }
interface DraftBatch { id?: number, name: string, status: string, sets: DraftSet[] }
interface Draft { id?: number, name: string, description: string, fee: number | undefined, min_down_payment: number | undefined, status: string, batches: DraftBatch[] }

const newSet = (name = 'Set A', base?: DraftSet): DraftSet => ({ name, slots: 20, start_date: '', training_days: base?.training_days ?? 10, time_label: base?.time_label ?? '8 AM – 5 PM', slots_taken: 0 })
const newBatch = (): DraftBatch => ({ name: '', status: 'open', sets: [newSet()] })
const draft = ref<Draft>({ name: '', description: '', fee: undefined, min_down_payment: undefined, status: 'open', batches: [newBatch()] })

async function load() {
  courses.value = await api.get<Course[]>('/admin/courses').catch((e) => {
    report(e, 'Couldn’t load courses')
    return []
  })
}

onMounted(() => {
  lookups.load()
  load()
})

const allSets = computed(() => courses.value.flatMap(c => (c.batches ?? []).flatMap(b => b.sets ?? [])))
const allBatches = computed(() => courses.value.flatMap(c => c.batches ?? []))
const totalSlots = computed(() => allSets.value.reduce((a, s) => a + s.slots, 0))
const totalTaken = computed(() => allSets.value.reduce((a, s) => a + s.slots_taken, 0))
const capPct = computed(() => (totalSlots.value ? Math.round(totalTaken.value / totalSlots.value * 100) : 0))

const stats = computed(() => [
  { label: 'Courses', value: courses.value.length, sub: `${courses.value.filter(c => c.status === 'open').length} open` },
  { label: 'Batches', value: allBatches.value.length, sub: `${allBatches.value.filter(b => b.status === 'open').length} open` },
  { label: 'Sets', value: allSets.value.length, sub: `${allSets.value.filter(s => s.slots_left === 0).length} full` },
  { label: 'Total slots', value: totalSlots.value, sub: 'across all sets' },
  { label: 'Enrolled', value: totalTaken.value, sub: `${capPct.value}% filled` },
  { label: 'Remaining slots', value: totalSlots.value - totalTaken.value, sub: 'available to enroll', tone: slotTone(totalSlots.value - totalTaken.value).text }
])

function edit(c?: Course) {
  formError.value = ''
  draft.value = c
    ? {
        id: c.id,
        name: c.name,
        description: c.description ?? '',
        fee: c.fee / 100,
        min_down_payment: c.min_down_payment / 100,
        status: c.status,
        batches: (c.batches ?? []).map(b => ({
          id: b.id,
          name: b.name,
          status: b.status,
          sets: (b.sets ?? []).map(s => ({ id: s.id, name: s.name, slots: s.slots, start_date: s.start_date, training_days: s.training_days, time_label: s.time_label, slots_taken: s.slots_taken }))
        }))
      }
    : { name: '', description: '', fee: undefined, min_down_payment: undefined, status: 'open', batches: [newBatch()] }
  open.value = true
}

function endText(s: DraftSet) {
  if (!s.start_date || !s.training_days) return 'Pick a start date and number of training days'
  const d = new Date(`${s.start_date}T00:00:00`)
  d.setDate(d.getDate() + Number(s.training_days) - 1)
  return `${longDate(s.start_date)} – ${longDate(d.toISOString().slice(0, 10))} (${s.training_days} consecutive days)`
}

function removeBatch(i: number) {
  const b = draft.value.batches[i]
  if (b?.sets.some(s => s.slots_taken > 0)) {
    formError.value = 'This batch has enrolled students — set it to Closed instead of removing it.'
    return
  }
  draft.value.batches.splice(i, 1)
}

function removeSet(b: DraftBatch, j: number) {
  const s = b.sets[j]
  if (s && s.slots_taken > 0) {
    formError.value = `${s.name || 'This set'} has enrolled students and can’t be removed.`
    return
  }
  if (b.sets.length === 1) {
    formError.value = 'A batch needs at least one set. Remove the batch instead.'
    return
  }
  b.sets.splice(j, 1)
}

function addSet(b: DraftBatch) {
  b.sets.push(newSet(`Set ${String.fromCharCode(65 + b.sets.length)}`, b.sets[0]))
}

const preview = computed(() => {
  const d = draft.value
  const sets = d.batches.flatMap(b => b.sets).filter(s => s.start_date).sort((a, b) => a.start_date.localeCompare(b.start_date))
  const count = d.batches.flatMap(b => b.sets).length
  return {
    line1: `${d.name || '[Course name]'} — ${d.fee ? peso(toCentavos(d.fee)) : '₱—'} · down payment from ${d.min_down_payment ? peso(toCentavos(d.min_down_payment)) : '₱—'}`,
    line2: sets[0] ? `Next schedule: ${longDate(sets[0].start_date)} · ${sets[0].training_days} training days · ${count} schedule option${count === 1 ? '' : 's'} to choose from` : 'No schedule yet'
  }
})

function validate(): string {
  const d = draft.value
  if (!d.name || !d.fee) return 'Course name and fee are required.'
  if ((d.min_down_payment ?? 0) > d.fee) return 'Down payment can’t be more than the course fee.'
  if (!d.batches.length) return 'Add at least one batch.'
  const unnamed = d.batches.findIndex(b => !b.name)
  if (unnamed > -1) return `Give Batch ${unnamed + 1} a name.`
  const bad = d.batches.find(b => b.sets.some(s => !s.start_date || !(Number(s.slots) > 0) || !(Number(s.training_days) > 0)))
  if (bad) return `Every set in “${bad.name}” needs available slots, a start date and training days.`
  return ''
}

async function save() {
  formError.value = validate()
  if (formError.value) return
  saving.value = true
  const d = draft.value
  const body = {
    name: d.name,
    description: d.description || null,
    fee: toCentavos(d.fee),
    min_down_payment: toCentavos(d.min_down_payment),
    status: d.status,
    batches: d.batches.map(b => ({
      id: b.id,
      name: b.name,
      status: b.status,
      sets: b.sets.map(s => ({ id: s.id, name: s.name, slots: Number(s.slots), start_date: s.start_date, training_days: Number(s.training_days), time_label: s.time_label }))
    }))
  }
  try {
    if (d.id) await api.put(`/admin/courses/${d.id}`, body)
    else await api.post('/admin/courses', body)
    toast.add({ title: d.id ? 'Course updated.' : 'Course added — it now appears on the website.', color: 'success', icon: 'i-lucide-check' })
    open.value = false
    await load()
  } catch (e) {
    formError.value = friendlyError(e)
  } finally {
    saving.value = false
  }
}

async function remove(c: Course) {
  if ((c.enrolled_count ?? 0) > 0) {
    toast.add({ title: `Can’t delete “${c.name}”`, description: `${c.enrolled_count} student(s) enrolled. Set its status to Archived instead.`, color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  if (confirmId.value !== c.id) {
    confirmId.value = c.id
    return
  }
  try {
    await api.del(`/admin/courses/${c.id}`)
    toast.add({ title: 'Course deleted.', color: 'neutral', icon: 'i-lucide-trash-2' })
    confirmId.value = null
    await load()
  } catch (e) {
    report(e, 'Course not deleted')
  }
}

function sum(c: Course, k: 'slots' | 'slots_taken') {
  return (c.batches ?? []).flatMap(b => b.sets ?? []).reduce((a, s) => a + s[k], 0)
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Courses"
      subtitle="Fee and minimum down payment are set once per course. Each course can run several batches, and each batch several sets with their own slots and training dates."
    >
      <template #actions>
        <UButton
          label="Add course"
          icon="i-lucide-plus"
          @click="edit()"
        />
      </template>
    </AdminPageHeader>

    <div
      role="list"
      aria-label="Course totals"
      class="mb-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3"
    >
      <AdminStatCard
        v-for="s in stats"
        :key="s.label"
        role="listitem"
        :label="s.label"
        :value="s.value"
        :sub="s.sub"
        :tone="s.tone"
      />
    </div>
    <div class="card mb-4 rounded-[14px] px-4 py-3.5">
      <div class="mb-2 flex flex-wrap justify-between gap-2.5 text-[13px]">
        <strong>Overall capacity</strong><span class="text-ink-600">{{ totalTaken }} of {{ totalSlots }} slots filled · {{ totalSlots - totalTaken }} remaining</span>
      </div>
      <UiSlotBar
        :taken="totalTaken"
        :slots="totalSlots"
        height="h-2.5"
      />
    </div>

    <section class="card overflow-hidden rounded-[14px]">
      <div class="overflow-x-auto">
        <table class="tbl min-w-[920px]">
          <thead>
            <tr class="bg-surface">
              <th>Course</th><th>Fee</th><th>Min. down</th><th>Batches</th><th>Next start</th><th>Enrolled</th><th>Remaining</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            <template
              v-for="c in courses"
              :key="c.id"
            >
              <tr>
                <td><strong>{{ c.name }}</strong></td>
                <td class="font-semibold">
                  {{ peso(c.fee) }}
                </td>
                <td>{{ peso(c.min_down_payment) }}</td>
                <td>
                  <UButton
                    variant="ghost"
                    size="sm"
                    :aria-expanded="!!expanded[c.id]"
                    :trailing-icon="expanded[c.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    :label="`${c.batches?.length ?? 0} ${c.batches?.length === 1 ? 'batch' : 'batches'} · ${(c.batches ?? []).flatMap(b => b.sets ?? []).length} sets`"
                    @click="expanded[c.id] = !expanded[c.id]"
                  />
                </td>
                <td>{{ longDate(c.next_start_date) }}</td>
                <td>
                  <strong>{{ sum(c, 'slots_taken') }}</strong> / {{ sum(c, 'slots') }}
                  <UiSlotBar
                    class="mt-1 w-[90px]"
                    :taken="sum(c, 'slots_taken')"
                    :slots="sum(c, 'slots')"
                  />
                </td>
                <td>
                  <strong :class="slotTone(sum(c, 'slots') - sum(c, 'slots_taken')).text">{{ sum(c, 'slots') - sum(c, 'slots_taken') }}</strong> <span class="text-xs text-ink-600">slots</span>
                </td>
                <td>
                  <UiStatusPill
                    :code="c.status"
                    :label="c.status_label"
                  />
                </td>
                <td class="text-right">
                  <span class="inline-flex gap-1.5">
                    <UButton
                      size="md"
                      variant="outline"
                      color="neutral"
                      label="Edit"
                      @click="edit(c)"
                    />
                    <UButton
                      size="md"
                      variant="ghost"
                      :label="confirmId === c.id ? 'Confirm delete' : 'Delete'"
                      @click="remove(c)"
                    />
                  </span>
                </td>
              </tr>
              <tr v-if="expanded[c.id]">
                <td
                  colspan="9"
                  class="bg-surface px-3.5 pt-3 pb-4"
                >
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-2.5">
                    <AdminBatchCard
                      v-for="b in c.batches"
                      :key="b.id"
                      :batch="b"
                    />
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>

    <USlideover
      v-model:open="open"
      :title="draft.id ? 'Edit course' : 'Add course'"
      :description="draft.id ? 'Changes apply to the website and new enrollments.' : 'New courses appear on the website once set to Open.'"
      :ui="{ content: 'max-w-[620px]' }"
    >
      <template #body>
        <div class="flex flex-col gap-4.5">
          <fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Course details
            </legend>
            <UFormField
              label="Course name"
              required
            >
              <UInput
                v-model="draft.name"
                placeholder="e.g. Meat Processing – Swine"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Short description">
              <UTextarea
                v-model="draft.description"
                :rows="2"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Status">
              <USelect
                v-model="draft.status"
                :items="lookups.items('course_statuses')"
                class="w-full"
              />
            </UFormField>
          </fieldset>
          <fieldset class="m-0 grid grid-cols-2 gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Fees
            </legend>
            <UFormField
              label="Course fee (₱)"
              required
            >
              <UInputNumber
                v-model="draft.fee"
                :min="0"
                :step="500"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Min. down payment (₱)">
              <UInputNumber
                v-model="draft.min_down_payment"
                :min="0"
                :step="500"
                class="w-full"
              />
            </UFormField>
          </fieldset>
          <fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Batches &amp; sets
            </legend>
            <p class="-mt-1 mb-0 text-xs text-ink-600">
              The course fee and down payment above apply to every batch and set.
            </p>
            <section
              v-for="(b, bi) in draft.batches"
              :key="bi"
              :aria-label="`Batch ${bi + 1}`"
              class="overflow-hidden rounded-xl border border-[#E7DDDA]"
            >
              <div class="flex flex-wrap items-end gap-2.5 bg-surface p-3">
                <UFormField
                  :label="`Batch ${bi + 1} name`"
                  class="flex-[2_1_220px]"
                >
                  <UInput
                    v-model="b.name"
                    placeholder="e.g. Batch 15 — March 2027"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Status"
                  class="flex-[1_1_120px]"
                >
                  <USelect
                    v-model="b.status"
                    :items="lookups.items('batch_statuses')"
                    class="w-full"
                  />
                </UFormField>
                <UButton
                  variant="ghost"
                  :label="b.sets.some(s => s.slots_taken) ? 'Has students' : 'Remove batch'"
                  @click="removeBatch(bi)"
                />
              </div>
              <div class="bg-surface px-3 pb-1 text-xs text-ink-600">
                {{ b.sets.length }} {{ b.sets.length === 1 ? 'set' : 'sets' }} · {{ b.sets.reduce((a, s) => a + Number(s.slots || 0), 0) }} slots
              </div>
              <div
                v-for="(s, si) in b.sets"
                :key="si"
                class="flex flex-col gap-2.5 border-t border-[#F3EEEC] p-3"
              >
                <div class="flex items-end gap-2.5">
                  <UFormField
                    label="Set name"
                    class="flex-1"
                  >
                    <UInput
                      v-model="s.name"
                      placeholder="Set A"
                      class="w-full"
                    />
                  </UFormField>
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-trash-2"
                    :aria-label="`Remove ${s.name || 'set'}`"
                    @click="removeSet(b, si)"
                  />
                </div>
                <div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5">
                  <UFormField label="Available slots">
                    <UInputNumber
                      v-model="s.slots"
                      :min="1"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Start date">
                    <UInput
                      v-model="s.start_date"
                      type="date"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Training days">
                    <UInputNumber
                      v-model="s.training_days"
                      :min="1"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Time">
                    <UInput
                      v-model="s.time_label"
                      placeholder="8 AM – 5 PM"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <div class="text-xs text-ink-600">
                  {{ endText(s) }} · {{ s.slots_taken }} of {{ s.slots }} slots taken
                </div>
              </div>
              <div class="border-t border-[#F3EEEC] px-3 py-2">
                <UButton
                  variant="ghost"
                  icon="i-lucide-plus"
                  :label="`Add set to ${b.name ? b.name.split(' — ')[0] : `batch ${bi + 1}`}`"
                  @click="addSet(b)"
                />
              </div>
            </section>
            <UButton
              variant="outline"
              color="neutral"
              icon="i-lucide-plus"
              label="Add batch"
              class="self-start"
              @click="draft.batches.push(newBatch())"
            />
          </fieldset>
          <div class="rounded-xl border border-line bg-surface p-3.5 text-[13px] leading-relaxed">
            <div class="mb-1 font-semibold">
              Shown to students as
            </div>
            <div>{{ preview.line1 }}</div>
            <div class="text-ink-600">
              {{ preview.line2 }}
            </div>
          </div>
          <p
            v-if="formError"
            role="alert"
            class="m-0 text-[13px] font-medium text-brand-600"
          >
            {{ formError }}
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            variant="outline"
            color="neutral"
            label="Cancel"
            @click="open = false"
          />
          <UButton
            :label="draft.id ? 'Save changes' : 'Add course'"
            :loading="saving"
            @click="save"
          />
        </div>
      </template>
    </USlideover>
  </div>
</template>
