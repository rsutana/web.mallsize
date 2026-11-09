<script setup lang="ts">
import type { NewsPost } from '~/types'

definePageMeta({ layout: 'admin', middleware: ['sanctum:auth', 'role'], roles: ['staff', 'admin'] })
useSeoMeta({ title: 'News' })

const api = useApi()
const lookups = useLookups()
const toast = useToast()
const { report, validationErrors } = useApiError()

const posts = ref<NewsPost[]>([])
const confirmId = ref<number | null>(null)
const open = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

interface Draft {
  id?: number
  title: string
  category: string
  summary: string
  body: string
  status: string
  published_on: string
  is_featured: boolean
  cover_url: string | null
  cover?: File | null
  is_cover_removed: boolean
}

const today = () => new Date().toISOString().slice(0, 10)
const blank = (): Draft => ({ title: '', category: 'announcement', summary: '', body: '', status: 'published', published_on: today(), is_featured: false, cover_url: null, cover: null, is_cover_removed: false })
const draft = reactive<Draft>(blank())

async function load() {
  posts.value = await api.get<NewsPost[]>('/admin/news-posts').catch((e) => {
    report(e, 'Couldn’t load news')
    return []
  })
}

onMounted(() => {
  lookups.load()
  load()
})

function edit(p?: NewsPost) {
  errors.value = {}
  Object.assign(draft, blank(), p
    ? { id: p.id, title: p.title, category: p.category, summary: p.summary ?? '', body: p.body ?? '', status: p.status, published_on: p.published_on ?? today(), is_featured: p.is_featured, cover_url: p.cover_url }
    : { id: undefined })
  open.value = true
}

function onCover(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  draft.cover = file
  draft.is_cover_removed = false
}

async function save(asDraft = false) {
  saving.value = true
  errors.value = {}
  const form = new FormData()
  form.append('title', draft.title)
  form.append('category', draft.category)
  form.append('summary', draft.summary)
  form.append('body', draft.body)
  form.append('status', asDraft ? 'draft' : draft.status === 'draft' ? 'published' : draft.status)
  form.append('published_on', draft.published_on)
  form.append('is_featured', draft.is_featured ? '1' : '0')
  form.append('is_cover_removed', draft.is_cover_removed ? '1' : '0')
  if (draft.cover) form.append('cover', draft.cover)
  if (draft.id) form.append('_method', 'PUT')

  try {
    await api.post(draft.id ? `/admin/news-posts/${draft.id}` : '/admin/news-posts', form)
    toast.add({ title: asDraft ? 'News post saved as draft.' : `News post ${draft.id ? 'updated' : 'published'} — live on the website.`, color: 'success', icon: 'i-lucide-check' })
    open.value = false
    await load()
  } catch (e) {
    errors.value = Object.fromEntries(validationErrors(e).map(f => [f.name, f.message]))
    report(e, 'Post not saved')
  } finally {
    saving.value = false
  }
}

async function remove(p: NewsPost) {
  if (confirmId.value !== p.id) {
    confirmId.value = p.id
    return
  }
  try {
    await api.del(`/admin/news-posts/${p.id}`)
    toast.add({ title: 'Post deleted.', color: 'neutral', icon: 'i-lucide-trash-2' })
    confirmId.value = null
    await load()
  } catch (e) {
    report(e, 'Post not deleted')
  }
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="News"
      subtitle="Posts published here appear on the website’s News page."
    >
      <template #actions>
        <UButton
          label="Add news"
          icon="i-lucide-plus"
          @click="edit()"
        />
      </template>
    </AdminPageHeader>
    <section class="card overflow-hidden rounded-[14px]">
      <div class="overflow-x-auto">
        <table class="tbl min-w-[820px]">
          <thead>
            <tr class="bg-surface">
              <th>Post</th><th>Category</th><th>Publish date</th><th>On home page</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="n in posts"
              :key="n.id"
            >
              <td>
                <strong>{{ n.title }}</strong>
                <div class="max-w-[360px] truncate text-xs text-ink-600">
                  {{ n.summary }}
                </div>
              </td>
              <td class="text-[13px]">
                {{ n.category_label }}
              </td>
              <td class="text-[13px]">
                {{ longDate(n.published_on) }}
              </td>
              <td class="text-[13px]">
                {{ n.is_featured ? 'Featured' : '—' }}
              </td>
              <td>
                <UiStatusPill
                  :code="n.status"
                  :label="n.status_label"
                />
              </td>
              <td class="text-right">
                <span class="inline-flex gap-1.5">
                  <UButton
                    size="md"
                    variant="outline"
                    color="neutral"
                    label="Edit"
                    @click="edit(n)"
                  />
                  <UButton
                    size="md"
                    variant="ghost"
                    :label="confirmId === n.id ? 'Confirm delete' : 'Delete'"
                    @click="remove(n)"
                  />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="!posts.length"
        class="m-0 p-6 text-center text-ink-600"
      >
        No news posts yet.
      </p>
    </section>

    <USlideover
      v-model:open="open"
      :title="draft.id ? 'Edit news' : 'Add news'"
      description="Publish an update to the website News page."
      :ui="{ content: 'max-w-[520px]' }"
    >
      <template #body>
        <div class="flex flex-col gap-5">
          <fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Post
            </legend>
            <UFormField
              label="Headline"
              :error="errors.title"
              required
            >
              <UInput
                v-model="draft.title"
                placeholder="e.g. Enrollment now open for December batches"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Category"
              :error="errors.category"
            >
              <USelect
                v-model="draft.category"
                :items="lookups.items('news_categories')"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Short summary"
              :error="errors.summary"
            >
              <UTextarea
                v-model="draft.summary"
                :rows="2"
                placeholder="One or two lines shown on the news card"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Full article"
              :error="errors.body"
            >
              <UTextarea
                v-model="draft.body"
                :rows="6"
                placeholder="Write the full post"
                class="w-full"
              />
            </UFormField>
          </fieldset>
          <fieldset class="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Cover photo
            </legend>
            <label class="relative flex cursor-pointer items-center gap-3.5 rounded-xl border-[1.5px] border-dashed border-line-strong p-3.5 focus-within:outline-3 focus-within:outline-accent-500">
              <img
                v-if="draft.cover_url && !draft.is_cover_removed && !draft.cover"
                :src="draft.cover_url"
                alt=""
                class="h-12 w-16 rounded-lg object-cover"
              >
              <span
                v-else
                aria-hidden="true"
                class="flex h-12 w-16 items-center justify-center rounded-lg bg-tint"
              ><UIcon
                name="i-lucide-image"
                class="size-5.5 text-ink-400"
              /></span>
              <span class="text-[13px]"><strong class="block">{{ draft.cover?.name ?? (draft.cover_url && !draft.is_cover_removed ? 'Replace cover photo' : 'Upload a cover photo') }}</strong><span class="text-ink-600">JPG or PNG, 1200×630 recommended</span></span>
              <input
                type="file"
                accept="image/*"
                class="sr-only"
                @change="onCover"
              >
            </label>
            <UButton
              v-if="draft.cover_url && !draft.is_cover_removed"
              variant="ghost"
              size="sm"
              label="Remove cover"
              class="self-start"
              @click="draft.is_cover_removed = true; draft.cover = null"
            />
            <p
              v-if="errors.cover"
              class="m-0 text-sm text-brand-600"
            >
              {{ errors.cover }}
            </p>
          </fieldset>
          <fieldset class="m-0 grid grid-cols-2 gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Publishing
            </legend>
            <UFormField label="Status">
              <USelect
                v-model="draft.status"
                :items="lookups.items('post_statuses')"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Publish date"
              :error="errors.published_on"
            >
              <UInput
                v-model="draft.published_on"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UCheckbox
              v-model="draft.is_featured"
              class="col-span-2"
              label="Feature on the home page"
            />
          </fieldset>
          <div class="rounded-xl border border-line bg-surface p-3.5 text-[13px] leading-relaxed">
            <div class="mb-1 font-semibold">
              Shown on the website as
            </div>
            <div class="font-semibold">
              {{ draft.title || '[Headline]' }}
            </div>
            <div class="text-ink-600">
              {{ lookups.label('news_categories', draft.category) }} · {{ longDate(draft.published_on) }}{{ draft.summary ? ` — ${draft.summary}` : '' }}
            </div>
            <div
              v-if="draft.is_featured"
              class="font-semibold text-brand-600"
            >
              Featured on the home page
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
