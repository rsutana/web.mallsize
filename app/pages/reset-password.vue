<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Choose a new password' })

const route = useRoute()
const api = useApi()
const toast = useToast()
const { report } = useApiError()
const hydrated = useHydrated()
const form = useTemplateRef('form')

const schema = z.object({
  email: z.email(),
  password: z.string().min(8, 'At least 8 characters'),
  password_confirmation: z.string()
}).refine(d => d.password === d.password_confirmation, { message: 'Passwords must match', path: ['password_confirmation'] })
type Schema = z.output<typeof schema>

const state = reactive<Schema>({ email: String(route.query.email ?? ''), password: '', password_confirmation: '' })
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await api.client('/reset-password', { method: 'POST', body: { ...event.data, token: route.query.token } })
    toast.add({ title: 'Password updated', description: 'You can now log in with your new password.', color: 'success', icon: 'i-lucide-check' })
    await navigateTo('/login')
  } catch (e) {
    form.value?.setErrors(report(e, 'Couldn’t reset your password'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="m-0 mb-1.5 text-[26px] font-semibold">
      Choose a new password
    </h2>
    <p class="mt-0 mb-5.5 text-sm text-ink-600">
      Use at least 8 characters.
    </p>
    <UForm
      ref="form"
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Email"
        name="email"
      >
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="username"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="New password"
        name="password"
      >
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Confirm password"
        name="password_confirmation"
      >
        <UInput
          v-model="state.password_confirmation"
          type="password"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        label="Update password"
        block
        :loading="loading"
        :disabled="!hydrated"
      />
    </UForm>
  </div>
</template>
