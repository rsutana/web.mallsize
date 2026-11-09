<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Forgot password' })

const api = useApi()
const { report } = useApiError()
const hydrated = useHydrated()
const form = useTemplateRef('form')

const schema = z.object({ email: z.email('Enter the email you registered with') })
type Schema = z.output<typeof schema>

const state = reactive<Schema>({ email: '' })
const sent = ref(false)
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await api.client('/forgot-password', { method: 'POST', body: event.data })
    sent.value = true
  } catch (e) {
    form.value?.setErrors(report(e, 'Couldn’t send the link'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="m-0 mb-1.5 text-[26px] font-semibold">
      Reset your password
    </h2>
    <p class="mt-0 mb-5.5 text-sm text-ink-600">
      Enter your email and we’ll send you a link to choose a new password.
    </p>
    <div
      v-if="sent"
      role="status"
      class="rounded-2xl border border-line bg-white p-6"
    >
      <p class="m-0 mb-4">
        If an account exists for <strong>{{ state.email }}</strong>, a reset link is on its way. Check your inbox.
      </p>
      <UButton
        to="/login"
        label="Back to login"
        variant="outline"
      />
    </div>
    <UForm
      v-else
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
          autocomplete="email"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        label="Send reset link"
        block
        :loading="loading"
        :disabled="!hydrated"
      />
      <NuxtLink
        to="/login"
        class="text-center text-sm"
      >
        Back to login
      </NuxtLink>
    </UForm>
  </div>
</template>
