<script setup lang="ts">
import type { Course, Orientation } from '~/types'

definePageMeta({ layout: 'admin', middleware: ['sanctum:auth', 'role'], roles: ['staff', 'admin'] })
useSeoMeta({ title: 'Orientations' })

const api = useApi()
const lookups = useLookups()
const toast = useToast()
const { report, validationErrors } = useApiError()

const rows = ref<Orientation[]>([])
const courses = ref<Course[]>([])
const confirmId = ref<number | null>(null)
const open = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

const DOMAINS: Record<string, RegExp> = {
  facebook: /(^|\.)(facebook\.com|fb\.com|fb\.watch)$/i,
  instagram: /(^|\.)instagram\.com$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/i
}
const PLACEHOLDERS: Record<string, string> = {
  facebook: 'https://www.facebook.com/…/posts/…',
  instagram: 'https://www.instagram.com/p/…',
  tiktok: 'https://www.tiktok.com/@…/video/…',
  youtube: 'https://www.youtube.com/watch?v=…'
}

interface Draft {
  id?: number
  title: string
  course_id: string
  details: string
  date: string
  time_label: string
  format: string
  venue: string
  is_social_linked: boolean
  social_platform: string
  social_url: string
  link_mode: 'direct' | 'details'
  status: string
  is_notify_students: boolean
}

const blank = (): Draft => ({ title: '', course_id: 'all', details: '', date: '', time_label: '', format: 'on_site', venue: '', is_social_linked: true, social_platform: 'facebook', social_url: '', link_mode: 'direct', status: 'published', is_notify_students: true })
const draft = reactive<Draft>(blank())

async function load() {
  rows.value = await api.get<Orientation[]>('/admin/orientations').catch((e) => {
    report(e, 'Couldn’t load orientations')
    return []
  })
}

onMounted(async () => {
  lookups.load()
  load()
  courses.value = await api.get<Course[]>('/courses').catch(() => [])
})

const courseItems = computed(() => [{ label: 'All courses', value: 'all' }, ...courses.value.map(c => ({ label: c.name, value: String(c.id) }))])
const platformLabel = computed(() => lookups.label('social_platforms', draft.social_platform))
const urlValid = computed(() => {
  try {
    const u = new URL(draft.social_url)
    return /^https?:$/.test(u.protocol) && (DOMAINS[draft.social_platform]?.test(u.hostname) ?? false)
  } catch {
    return false
  }
})

function edit(o?: Orientation) {
  errors.value = {}
  Object.assign(draft, blank(), o
    ? {
        id: o.id, title: o.title, course_id: o.course_id ? String(o.course_id) : 'all', details: o.details ?? '', date: o.date, time_label: o.time_label ?? '',
        format: o.format, venue: o.venue ?? '', is_social_linked: o.is_social_linked, social_platform: o.social_platform ?? 'facebook', social_url: o.social_url ?? '',
        link_mode: o.link_mode, status: o.status, is_notify_students: o.is_notify_students
      }
    : { id: undefined })
  open.value = true
}

async function save(asDraft = false) {
  saving.value = true
  errors.value = {}
  const body = {
    ...draft,
    id: undefined,
    course_id: draft.course_id === 'all' ? null : Number(draft.course_id),
    social_platform: draft.is_social_linked ? draft.social_platform : null,
    social_url: draft.is_social_linked ? draft.social_url : null,
    status: asDraft ? 'draft' : 'published'
  }
  try {
    if (draft.id) await api.put(`/admin/orientations/${draft.id}`, body)
    else await api.post('/admin/orientations', body)
    const notified = !asDraft && draft.is_notify_students
    toast.add({
      title: asDraft ? 'Orientation saved as draft.' : `Orientation ${draft.id ? 'updated' : 'published'} — live on the website.`,
      description: notified ? 'Enrolled students are emailed and texted the first time it’s published.' : undefined,
      color: 'success',
      icon: 'i-lucide-check'
    })
    open.value = false
    await load()
  } catch (e) {
    errors.value = Object.fromEntries(validationErrors(e).map(f => [f.name, f.message]))
    report(e, 'Orientation not saved')
  } finally {
    saving.value = false
  }
}

async function remove(o: Orientation) {
  if (confirmId.value !== o.id) {
    confirmId.value = o.id
    return
  }
  try {
    await api.del(`/admin/orientations/${o.id}`)
    toast.add({ title: 'Orientation deleted.', color: 'neutral', icon: 'i-lucide-trash-2' })
    confirmId.value = null
    await load()
  } catch (e) {
    report(e, 'Orientation not deleted')
  }
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Orientations"
      subtitle="Orientation schedules shown on the website’s Orientation page, with optional links to your social media posts."
    >
      <template #actions>
        <UButton
          label="Add orientation"
          icon="i-lucide-plus"
          @click="edit()"
        />
      </template>
    </AdminPageHeader>
    <section class="card overflow-hidden rounded-[14px]">
      <div class="overflow-x-auto">
        <table class="tbl min-w-[980px]">
          <thead>
            <tr class="bg-surface">
              <th>Orientation</th><th>Course</th><th>Date &amp; time</th><th>Where</th><th>Social post</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="o in rows"
              :key="o.id"
            >
              <td><strong>{{ o.title }}</strong></td>
              <td class="text-[13px]">
                {{ o.course_name ?? 'All courses' }}
              </td>
              <td class="text-[13px]">
                {{ longDate(o.date) }}<div class="text-ink-600">
                  {{ o.time_label }}
                </div>
              </td>
              <td class="text-[13px]">
                {{ o.format_label }}<div class="text-ink-600">
                  {{ o.venue }}
                </div>
              </td>
              <td class="text-[13px]">
                <template v-if="o.is_social_linked && o.social_url">
                  <a
                    :href="o.social_url"
                    target="_blank"
                    rel="noopener"
                    class="font-semibold"
                  >{{ o.social_platform_label }} post ↗</a>
                  <div class="text-xs text-ink-600">
                    {{ o.link_mode === 'direct' ? 'Opens directly' : 'Via details card' }}
                  </div>
                </template>
                <span
                  v-else
                  class="text-ink-600"
                >None</span>
              </td>
              <td>
                <UiStatusPill
                  :code="o.status"
                  :label="o.status_label"
                />
              </td>
              <td class="text-right">
                <span class="inline-flex gap-1.5">
                  <UButton
                    size="md"
                    variant="outline"
                    color="neutral"
                    label="Edit"
                    @click="edit(o)"
                  />
                  <UButton
                    size="md"
                    variant="ghost"
                    :label="confirmId === o.id ? 'Confirm delete' : 'Delete'"
                    @click="remove(o)"
                  />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="!rows.length"
        class="m-0 p-6 text-center text-ink-600"
      >
        No orientations scheduled.
      </p>
    </section>

    <USlideover
      v-model:open="open"
      :title="draft.id ? 'Edit orientation' : 'Add orientation'"
      description="Schedule an orientation and link the social post you shared about it."
      :ui="{ content: 'max-w-[520px]' }"
    >
      <template #body>
        <div class="flex flex-col gap-5">
          <fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Orientation
            </legend>
            <UFormField
              label="Title"
              :error="errors.title"
              required
            >
              <UInput
                v-model="draft.title"
                placeholder="e.g. Pre-training orientation — December batch"
                class="w-full"
              />
            </UFormField>
            <UFormField label="For course">
              <USelect
                v-model="draft.course_id"
                :items="courseItems"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Details">
              <UTextarea
                v-model="draft.details"
                :rows="3"
                placeholder="What to bring, dress code, what will be discussed"
                class="w-full"
              />
            </UFormField>
          </fieldset>
          <fieldset class="m-0 grid grid-cols-2 gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              When &amp; where
            </legend>
            <UFormField
              label="Date"
              :error="errors.date"
              required
            >
              <UInput
                v-model="draft.date"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Time">
              <UInput
                v-model="draft.time_label"
                placeholder="9:00 AM – 11:00 AM"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Format">
              <USelect
                v-model="draft.format"
                :items="lookups.items('orientation_formats')"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Venue / meeting link">
              <UInput
                v-model="draft.venue"
                placeholder="Training room or Zoom link"
                class="w-full"
              />
            </UFormField>
          </fieldset>
          <fieldset class="m-0 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <legend class="px-1.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Social media post
            </legend>
            <UCheckbox
              v-model="draft.is_social_linked"
              label="Link to a social media post"
              description="Use the post you already shared on Facebook, Instagram, TikTok or YouTube."
            />
            <template v-if="draft.is_social_linked">
              <div
                role="radiogroup"
                aria-label="Platform"
                class="flex flex-wrap gap-2"
              >
                <button
                  v-for="p in lookups.options('social_platforms')"
                  :key="p.code"
                  type="button"
                  role="radio"
                  :aria-checked="draft.social_platform === p.code"
                  class="chip"
                  :class="draft.social_platform === p.code ? 'chip-on' : ''"
                  @click="draft.social_platform = p.code"
                >
                  {{ p.label }}
                </button>
              </div>
              <UFormField
                label="Post URL"
                :error="errors.social_url"
              >
                <UInput
                  v-model="draft.social_url"
                  type="url"
                  :placeholder="PLACEHOLDERS[draft.social_platform]"
                  class="w-full"
                />
              </UFormField>
              <p
                v-if="draft.social_url && urlValid"
                class="m-0 text-[13px] font-medium text-ok"
              >
                ✓ Valid {{ platformLabel }} link
              </p>
              <p
                v-else-if="draft.social_url"
                role="alert"
                class="m-0 text-[13px] font-medium text-brand-600"
              >
                This doesn’t look like a {{ platformLabel }} link.
              </p>
              <URadioGroup
                v-model="draft.link_mode"
                legend="On the website, the orientation card…"
                variant="card"
                :items="[
                  { value: 'direct', label: 'Opens the social post directly', description: `Visitors go straight to the ${platformLabel} post.` },
                  { value: 'details', label: 'Shows details, with a link to the post', description: `Date, venue and notes first, then “View on ${platformLabel}”.` }
                ]"
              />
            </template>
          </fieldset>
          <fieldset class="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Publishing
            </legend>
            <UCheckbox
              v-model="draft.is_notify_students"
              label="Email and SMS enrolled students of this course when published"
            />
          </fieldset>
          <div class="rounded-xl border border-line bg-surface p-3.5 text-[13px] leading-relaxed">
            <div class="mb-1 font-semibold">
              Shown on the website as
            </div>
            <div class="font-semibold">
              {{ draft.title || '[Orientation title]' }}
            </div>
            <div class="text-ink-600">
              {{ draft.date ? longDate(draft.date) : '[Date]' }}{{ draft.time_label ? ` · ${draft.time_label}` : '' }} · {{ lookups.label('orientation_formats', draft.format) }}{{ draft.venue ? ` — ${draft.venue}` : '' }}
            </div>
            <div class="font-semibold text-brand-600">
              {{ draft.is_social_linked ? (draft.link_mode === 'direct' ? `Button: “Open ${platformLabel} post ↗”` : `Button: “View details” → link to ${platformLabel} post`) : 'Button: “View details”' }}
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full flex-wrap justify-end gap-2">
          <UButton
            variant="outline"
            color="neutral"
            label="Cancel"
            @click="open = false"
          />
          <UButton
            variant="outline"
            label="Save as draft"
            :loading="saving"
            @click="save(true)"
          />
          <UButton
            :label="draft.id ? 'Save & publish' : 'Publish'"
            :loading="saving"
            @click="save()"
          />
        </div>
      </template>
    </USlideover>
  </div>
</template>
