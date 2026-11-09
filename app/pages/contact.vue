<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

useSeoMeta({ title: 'Contact us' })

const site = useAppConfig().site
const api = useApi()
const { report } = useApiError()
const hydrated = useHydrated()
const form = useTemplateRef('form')

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  mobile: z.string().optional(),
  email: z.email('Enter a valid email'),
  message: z.string().min(5, 'Tell us what you’d like to know')
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ name: '', mobile: '', email: '', message: '' })
const sent = ref(false)
const sending = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  sending.value = true
  try {
    await api.post('/inquiries', event.data)
    sent.value = true
  } catch (e) {
    form.value?.setErrors(report(e, 'Message not sent'))
  } finally {
    sending.value = false
  }
}

function reset() {
  Object.assign(state, { name: '', mobile: '', email: '', message: '' })
  sent.value = false
}
</script>

<template>
  <section class="mx-auto flex max-w-[1240px] flex-wrap gap-8 px-6 pt-12 pb-16">
    <div class="flex-[1_1_340px]">
      <h1 class="display m-0 mb-4 text-[44px]">
        Contact us
      </h1>
      <dl class="m-0 flex flex-col gap-4 text-[15px]">
        <div>
          <dt class="font-semibold">
            Address
          </dt>
          <dd class="mt-0.5 text-ink-600">
            {{ site.address }}
          </dd>
        </div>
        <div>
          <dt class="font-semibold">
            Mobile
          </dt>
          <dd class="mt-0.5 text-ink-600">
            {{ site.mobile }}
          </dd>
        </div>
        <div>
          <dt class="font-semibold">
            Email
          </dt>
          <dd class="mt-0.5 text-ink-600">
            {{ site.email }}
          </dd>
        </div>
        <div>
          <dt class="font-semibold">
            Office hours
          </dt>
          <dd class="mt-0.5 text-ink-600">
            {{ site.officeHours }}
          </dd>
        </div>
      </dl>
      <iframe
        v-if="site.mapEmbedUrl"
        :src="site.mapEmbedUrl"
        title="Map to MallSize Training Center"
        class="mt-5 h-[200px] w-full rounded-[14px] border-0"
        loading="lazy"
      />
      <div
        v-else
        class="mt-5 flex h-[200px] items-center justify-center rounded-[14px] bg-tint text-[13px] text-ink-400"
      >
        [Map embed]
      </div>
    </div>
    <div class="flex-[1_1_460px] rounded-2xl border border-line bg-white p-7">
      <template v-if="!sent">
        <h2 class="m-0 mb-4 text-xl font-semibold">
          Send an inquiry
        </h2>
        <UForm
          ref="form"
          :schema="schema"
          :state="state"
          class="flex flex-col gap-3.5"
          @submit="onSubmit"
        >
          <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
            <UFormField
              label="Full name"
              name="name"
            >
              <UInput
                v-model="state.name"
                placeholder="Juan Dela Cruz"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Mobile number"
              name="mobile"
            >
              <UInput
                v-model="state.mobile"
                type="tel"
                placeholder="09XX XXX XXXX"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField
            label="Email"
            name="email"
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="you@email.com"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Message"
            name="message"
          >
            <UTextarea
              v-model="state.message"
              :rows="4"
              placeholder="Ask about schedules, fees or training locations"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            label="Send message"
            class="self-start"
            :loading="sending"
            :disabled="!hydrated"
          />
        </UForm>
      </template>
      <div
        v-else
        role="status"
      >
        <h2 class="m-0 mb-2 text-xl font-semibold">
          Thanks — message sent
        </h2>
        <p class="m-0 mb-4 text-ink-600">
          Our staff will reply by email or SMS within one business day.
        </p>
        <UButton
          variant="outline"
          label="Send another"
          @click="reset"
        />
      </div>
    </div>
  </section>
</template>
