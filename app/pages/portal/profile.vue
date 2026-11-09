<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { User } from '~/types'

definePageMeta({ layout: 'portal', middleware: ['sanctum:auth', 'role'], roles: ['student'] })
useSeoMeta({ title: 'Profile' })

const api = useApi()
const toast = useToast()
const lookups = useLookups()
const { user, refreshIdentity } = useCurrentUser()
const { report } = useApiError()
const hydrated = useHydrated()
const profileForm = useTemplateRef('profileForm')
const passwordForm = useTemplateRef('passwordForm')

onMounted(() => {
  lookups.load().catch(() => {})
})

const profileSchema = z.object({
  first_name: z.string().min(1, 'Enter your first name'),
  middle_name: z.string().nullable().optional(),
  last_name: z.string().min(1, 'Enter your last name'),
  email: z.email('Enter a valid email'),
  mobile: z.string().regex(/^(\+?63|0)9\d{2}\s?\d{3}\s?\d{4}$/, 'Enter a mobile number like 0917 555 0148'),
  birthdate: z.string().nullable().optional(),
  sex: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  is_email_notifications: z.boolean(),
  is_sms_notifications: z.boolean()
})
type ProfileSchema = z.output<typeof profileSchema>

const s = user.value?.student
const profile = reactive<ProfileSchema>({
  first_name: s?.first_name ?? '',
  middle_name: s?.middle_name ?? '',
  last_name: s?.last_name ?? '',
  email: user.value?.email ?? '',
  mobile: user.value?.mobile ?? '',
  birthdate: s?.birthdate ?? '',
  sex: s?.sex ?? undefined,
  education: s?.education ?? undefined,
  address: s?.address ?? '',
  is_email_notifications: user.value?.is_email_notifications ?? true,
  is_sms_notifications: user.value?.is_sms_notifications ?? true
})
const savingProfile = ref(false)

async function saveProfile(event: FormSubmitEvent<ProfileSchema>) {
  savingProfile.value = true
  try {
    await api.patch<User>('/student/profile', { ...event.data, birthdate: event.data.birthdate || null })
    await refreshIdentity()
    toast.add({ title: 'Profile saved', color: 'success', icon: 'i-lucide-check' })
  } catch (e) {
    profileForm.value?.setErrors(report(e, 'Profile not saved'))
  } finally {
    savingProfile.value = false
  }
}

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Enter your current password'),
  password: z.string().min(8, 'At least 8 characters'),
  password_confirmation: z.string()
}).refine(d => d.password === d.password_confirmation, { message: 'Passwords must match', path: ['password_confirmation'] })
type PasswordSchema = z.output<typeof passwordSchema>

const passwords = reactive<PasswordSchema>({ current_password: '', password: '', password_confirmation: '' })
const savingPassword = ref(false)

async function savePassword(event: FormSubmitEvent<PasswordSchema>) {
  savingPassword.value = true
  try {
    await api.client('/user/password', { method: 'PUT', body: event.data })
    Object.assign(passwords, { current_password: '', password: '', password_confirmation: '' })
    toast.add({ title: 'Password updated', color: 'success', icon: 'i-lucide-check' })
  } catch (e) {
    passwordForm.value?.setErrors(report(e, 'Password not changed'))
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="m-0 mb-4.5 text-[26px] font-semibold">
      Profile
    </h1>
    <div class="flex flex-wrap items-start gap-4.5">
      <section class="card min-w-0 flex-[999_1_460px] p-5.5">
        <h2 class="m-0 mb-4 text-lg font-semibold">
          Personal details
        </h2>
        <UForm
          ref="profileForm"
          :schema="profileSchema"
          :state="profile"
          class="flex flex-col gap-3.5"
          @submit="saveProfile"
        >
          <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
            <UFormField
              label="First name"
              name="first_name"
            >
              <UInput
                v-model="profile.first_name"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Middle name"
              name="middle_name"
            >
              <UInput
                v-model="profile.middle_name as string"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Last name"
              name="last_name"
            >
              <UInput
                v-model="profile.last_name"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Email (login)"
              name="email"
            >
              <UInput
                v-model="profile.email"
                type="email"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Mobile"
              name="mobile"
            >
              <UInput
                v-model="profile.mobile"
                type="tel"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Birthdate"
              name="birthdate"
            >
              <UInput
                v-model="profile.birthdate as string"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Sex"
              name="sex"
            >
              <USelect
                v-model="profile.sex as string"
                :items="lookups.items('sexes')"
                placeholder="Select"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Highest education"
              name="education"
            >
              <USelect
                v-model="profile.education as string"
                :items="lookups.items('education_levels')"
                placeholder="Select"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField
            label="Address"
            name="address"
          >
            <UInput
              v-model="profile.address as string"
              class="w-full"
            />
          </UFormField>
          <div class="flex flex-col gap-2">
            <UCheckbox
              v-model="profile.is_email_notifications"
              label="Email notifications"
            />
            <UCheckbox
              v-model="profile.is_sms_notifications"
              label="SMS notifications"
            />
          </div>
          <UButton
            type="submit"
            label="Save changes"
            class="self-start"
            :loading="savingProfile"
            :disabled="!hydrated"
          />
        </UForm>
      </section>
      <section class="card flex-[1_1_300px] p-5.5">
        <h2 class="m-0 mb-4 text-lg font-semibold">
          Security
        </h2>
        <UForm
          ref="passwordForm"
          :schema="passwordSchema"
          :state="passwords"
          class="flex flex-col gap-3.5"
          @submit="savePassword"
        >
          <UFormField
            label="Current password"
            name="current_password"
          >
            <UInput
              v-model="passwords.current_password"
              type="password"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="New password"
            name="password"
          >
            <UInput
              v-model="passwords.password"
              type="password"
              autocomplete="new-password"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Confirm new password"
            name="password_confirmation"
          >
            <UInput
              v-model="passwords.password_confirmation"
              type="password"
              autocomplete="new-password"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            variant="outline"
            label="Update password"
            :loading="savingPassword"
            :disabled="!hydrated"
          />
        </UForm>
      </section>
    </div>
  </div>
</template>
