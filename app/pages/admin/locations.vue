<script setup lang="ts">
import type { Location } from '~/types'

definePageMeta({ layout: 'admin', middleware: ['sanctum:auth', 'role'], roles: ['admin'] })
useSeoMeta({ title: 'Locations' })

const api = useApi()
const lookups = useLookups()
const toast = useToast()
const { report, validationErrors } = useApiError()

const locations = ref<Location[]>([])
const filters = reactive({ q: '', city: 'all', status: 'all' })
const confirmId = ref<number | null>(null)
const open = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

type Draft = Omit<Location, 'id' | 'type_label'> & { id?: number }
const blank = (): Draft => ({ name: '', type: 'pork_and_beef', contact_person: '', mobile: '', email: '', street: '', barangay: '', city: '', province: '', zip: '', map_url: '', notes: '', is_active: true })
const draft = reactive<Draft>(blank())

async function load() {
  locations.value = await api.get<Location[]>('/admin/locations').catch((e) => {
    report(e, 'Couldn’t load locations')
    return []
  })
}

onMounted(() => {
  lookups.load()
  load()
})

const cities = computed(() => [...new Set(locations.value.map(l => l.city))].sort())
const provinces = computed(() => new Set(locations.value.map(l => l.province).filter(Boolean)).size)
const rows = computed(() => {
  const q = filters.q.trim().toLowerCase()
  return locations.value.filter(l => (filters.city === 'all' || l.city === filters.city)
    && (filters.status === 'all' || (filters.status === 'active') === l.is_active)
    && (!q || `${l.name} ${l.contact_person} ${l.barangay} ${l.street}`.toLowerCase().includes(q)))
})

function area(l: Location) {
  return [l.barangay && `Brgy. ${l.barangay}`, l.city, l.province, l.zip].filter(Boolean).join(', ')
}

function edit(l?: Location) {
  errors.value = {}
  Object.assign(draft, blank(), l ? { ...l, email: l.email ?? '', notes: l.notes ?? '', map_url: l.map_url ?? '' } : { id: undefined })
  open.value = true
}

async function save() {
  saving.value = true
  errors.value = {}
  const body: Record<string, unknown> = { ...draft, id: undefined, type_label: undefined }
  for (const k of ['email', 'map_url', 'notes', 'street', 'barangay', 'province', 'zip']) if (body[k] === '') body[k] = null
  try {
    if (draft.id) await api.put(`/admin/locations/${draft.id}`, body)
    else await api.post('/admin/locations', body)
    toast.add({ title: draft.id ? 'Location updated.' : 'Location added.', color: 'success', icon: 'i-lucide-check' })
    open.value = false
    await load()
  } catch (e) {
    errors.value = Object.fromEntries(validationErrors(e).map(f => [f.name, f.message]))
    report(e, 'Location not saved')
  } finally {
    saving.value = false
  }
}

async function remove(l: Location) {
  if (confirmId.value !== l.id) {
    confirmId.value = l.id
    return
  }
  try {
    await api.del(`/admin/locations/${l.id}`)
    toast.add({ title: 'Location deleted.', color: 'neutral', icon: 'i-lucide-trash-2' })
    confirmId.value = null
    await load()
  } catch (e) {
    report(e, 'Location not deleted')
  }
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Locations"
      subtitle="Meat shop partners and where they are."
    >
      <template #actions>
        <UButton
          label="Add location"
          icon="i-lucide-plus"
          @click="edit()"
        />
      </template>
    </AdminPageHeader>
    <div
      role="list"
      aria-label="Location totals"
      class="mb-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3"
    >
      <AdminStatCard
        role="listitem"
        label="Partner shops"
        :value="locations.length"
        sub="all locations"
      />
      <AdminStatCard
        role="listitem"
        label="Active"
        :value="locations.filter(l => l.is_active).length"
        sub="currently partnered"
      />
      <AdminStatCard
        role="listitem"
        label="Cities"
        :value="cities.length"
        :sub="cities.slice(0, 2).join(', ') + (cities.length > 2 ? '…' : '')"
      />
      <AdminStatCard
        role="listitem"
        label="Provinces"
        :value="provinces"
        sub="Davao Region"
      />
    </div>
    <section class="card overflow-hidden rounded-[14px]">
      <div class="flex flex-wrap items-end gap-3 p-3.5">
        <UFormField
          label="Search"
          class="flex-[2_1_260px]"
        >
          <UInput
            v-model="filters.q"
            type="search"
            icon="i-lucide-search"
            placeholder="Shop name, contact person or barangay"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="City / municipality"
          class="flex-[1_1_200px]"
        >
          <USelect
            v-model="filters.city"
            :items="[{ label: 'All', value: 'all' }, ...cities.map(c => ({ label: c, value: c }))]"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Status"
          class="flex-[1_1_160px]"
        >
          <USelect
            v-model="filters.status"
            :items="[{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]"
            class="w-full"
          />
        </UFormField>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl min-w-[940px]">
          <thead>
            <tr class="bg-surface">
              <th>Meat shop</th><th>Contact</th><th>Address</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="l in rows"
              :key="l.id"
            >
              <td>
                <strong>{{ l.name }}</strong><div class="text-xs text-ink-600">
                  {{ l.type_label }}
                </div>
              </td>
              <td class="text-[13px]">
                <div class="font-semibold">
                  {{ l.contact_person }}
                </div>
                <div><a :href="`tel:${l.mobile.replace(/\s/g, '')}`">{{ l.mobile }}</a></div>
                <div class="break-all text-ink-600">
                  {{ l.email }}
                </div>
              </td>
              <td class="max-w-[320px] text-[13px]">
                {{ l.street }}
                <div class="text-ink-600">
                  {{ area(l) }}
                </div>
                <a
                  v-if="l.map_url"
                  :href="l.map_url"
                  target="_blank"
                  rel="noopener"
                  class="text-xs font-semibold"
                >Open in Maps ↗</a>
              </td>
              <td>
                <UiStatusPill
                  :code="l.is_active ? 'active' : 'inactive'"
                  :label="l.is_active ? 'Active' : 'Inactive'"
                />
              </td>
              <td class="text-right">
                <span class="inline-flex gap-1.5">
                  <UButton
                    size="md"
                    variant="outline"
                    color="neutral"
                    label="Edit"
                    @click="edit(l)"
                  />
                  <UButton
                    size="md"
                    variant="ghost"
                    :label="confirmId === l.id ? 'Confirm delete' : 'Delete'"
                    @click="remove(l)"
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
        No locations match these filters.
      </p>
    </section>

    <USlideover
      v-model:open="open"
      :title="draft.id ? 'Edit location' : 'Add location'"
      description="Partner meat shop details."
      :ui="{ content: 'max-w-[520px]' }"
    >
      <template #body>
        <div class="flex flex-col gap-5">
          <fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Meat shop
            </legend>
            <UFormField
              label="Shop name"
              :error="errors.name"
              required
            >
              <UInput
                v-model="draft.name"
                placeholder="e.g. Santos Meat Shop"
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Shop type">
                <USelect
                  v-model="draft.type"
                  :items="lookups.items('location_types')"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Status">
                <USelect
                  v-model="draft.is_active"
                  :items="[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]"
                  class="w-full"
                />
              </UFormField>
            </div>
          </fieldset>
          <fieldset class="m-0 grid grid-cols-2 gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Contact
            </legend>
            <UFormField
              label="Contact person"
              class="col-span-2"
              :error="errors.contact_person"
              required
            >
              <UInput
                v-model="draft.contact_person"
                placeholder="Owner or branch manager"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Mobile number"
              :error="errors.mobile"
              required
            >
              <UInput
                v-model="draft.mobile"
                type="tel"
                placeholder="09XX XXX XXXX"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Email"
              :error="errors.email"
            >
              <UInput
                v-model="draft.email as string"
                type="email"
                placeholder="Optional"
                class="w-full"
              />
            </UFormField>
          </fieldset>
          <fieldset class="m-0 grid grid-cols-2 gap-3 border-0 p-0">
            <legend class="mb-2.5 text-xs font-semibold tracking-[.6px] text-ink-600 uppercase">
              Address
            </legend>
            <UFormField
              label="Street / building"
              class="col-span-2"
            >
              <UInput
                v-model="draft.street as string"
                placeholder="Stall no., building, street"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Barangay">
              <UInput
                v-model="draft.barangay as string"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="City / municipality"
              :error="errors.city"
              required
            >
              <UInput
                v-model="draft.city"
                placeholder="e.g. Davao City"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Province">
              <UInput
                v-model="draft.province as string"
                placeholder="e.g. Davao del Sur"
                class="w-full"
              />
            </UFormField>
            <UFormField label="ZIP code">
              <UInput
                v-model="draft.zip as string"
                inputmode="numeric"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Google Maps link"
              class="col-span-2"
              :error="errors.map_url"
            >
              <UInput
                v-model="draft.map_url as string"
                type="url"
                placeholder="https://maps.app.goo.gl/…"
                class="w-full"
              />
            </UFormField>
          </fieldset>
          <UFormField label="Notes">
            <UTextarea
              v-model="draft.notes as string"
              :rows="3"
              placeholder="Partnership details, operating hours, etc."
              class="w-full"
            />
          </UFormField>
          <div class="rounded-xl border border-line bg-surface p-3.5 text-[13px] leading-relaxed">
            <div class="mb-1 font-semibold">
              Summary
            </div>
            <div class="font-semibold">
              {{ draft.name || '[Shop name]' }} · {{ lookups.label('location_types', draft.type) }}
            </div>
            <div class="text-ink-600">
              {{ [draft.contact_person, draft.mobile, draft.email].filter(Boolean).join(' · ') || '[Contact]' }}
            </div>
            <div class="text-ink-600">
              {{ [draft.street, draft.barangay && `Brgy. ${draft.barangay}`, draft.city, draft.province].filter(Boolean).join(', ') || '[Address]' }}
            </div>
          </div>
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
            :label="draft.id ? 'Save changes' : 'Add location'"
            :loading="saving"
            @click="save"
          />
        </div>
      </template>
    </USlideover>
  </div>
</template>
