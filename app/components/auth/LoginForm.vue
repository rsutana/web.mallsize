<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps<{ staff?: boolean }>()

const { login } = useSanctumAuth()
const { user, home, logout } = useCurrentUser()
const { report } = useApiError()
const hydrated = useHydrated()
const route = useRoute()
const form = useTemplateRef('form')

const schema = z.object({
  email: z.email('Enter the email you registered with'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional()
})
type Schema = z.output<typeof schema>

const state = reactive<Schema>({ email: '', password: '', remember: false })
const loading = ref(false)
const wrongArea = ref('')

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  wrongArea.value = ''
  try {
    await login({ email: event.data.email, password: event.data.password, remember: event.data.remember })

    const isBackOffice = user.value?.role === 'staff' || user.value?.role === 'admin'
    if (props.staff !== isBackOffice) {
      wrongArea.value = isBackOffice
        ? 'This is a staff account — you’ve been taken to the back office.'
        : 'This is a student account — you’ve been taken to your portal.'
    }

    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith(isBackOffice ? '/admin' : '/portal')
      ? route.query.redirect
      : home.value
    await navigateTo(redirect)
  } catch (e) {
    form.value?.setErrors(report(e, 'Login failed'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="m-0 mb-1.5 text-[26px] font-semibold">
      {{ staff ? 'Staff sign-in' : 'Log in' }}
    </h2>
    <p class="mt-0 mb-5.5 text-sm text-ink-600">
      {{ staff ? 'Use your back-office account.' : 'Use the email and password you created during registration.' }}
    </p>

    <UAlert
      v-if="user"
      class="mb-4"
      color="neutral"
      variant="subtle"
      :title="`You’re signed in as ${user.name}`"
      :actions="[{ label: 'Continue', to: home }, { label: 'Log out', color: 'neutral', variant: 'outline', onClick: () => logout() }]"
    />

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
          placeholder="you@email.com"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Password"
        name="password"
      >
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="current-password"
          placeholder="Your password"
          class="w-full"
        />
      </UFormField>
      <div class="flex items-center justify-between text-sm">
        <UCheckbox
          v-model="state.remember"
          label="Remember me"
        />
        <NuxtLink to="/forgot-password">
          Forgot password?
        </NuxtLink>
      </div>
      <UButton
        type="submit"
        :label="staff ? 'Sign in' : 'Log in'"
        block
        :loading="loading"
        :disabled="!hydrated"
      />
      <p
        v-if="wrongArea"
        role="status"
        class="m-0 text-sm text-ink-600"
      >
        {{ wrongArea }}
      </p>
    </UForm>

    <p
      v-if="!staff"
      class="mt-5.5 text-center text-sm text-ink-600"
    >
      New here? <NuxtLink
        to="/register"
        class="font-semibold"
      >Register and enroll</NuxtLink>
    </p>
    <p class="mt-7 text-center text-[13px] text-ink-500">
      <template v-if="staff">
        Student? <NuxtLink to="/login">Student login</NuxtLink>
      </template>
      <template v-else>
        Staff or admin? <NuxtLink to="/staff/login">Staff sign-in</NuxtLink>
      </template>
    </p>
  </div>
</template>
