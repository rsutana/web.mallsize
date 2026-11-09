<script setup lang="ts">
import type { Payment } from '~/types'

definePageMeta({ layout: 'register', middleware: ['sanctum:auth', 'role'], roles: ['student'] })
useSeoMeta({ title: 'Payment successful' })

const route = useRoute()
const { user } = useCurrentUser()
const checkout = useCheckout()
const portal = usePortalStore()
const payment = ref<Payment | null>(null)
const countdown = ref(5)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  const id = Number(route.query.payment)
  if (id) payment.value = await checkout.status(id).catch(() => null)
  portal.refresh().catch(() => {})
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      navigateTo({ path: '/portal', query: { welcome: '1' } })
    }
  }, 1000)
})

onBeforeUnmount(() => clearInterval(timer))

const channels = computed(() => [user.value?.is_email_notifications ? 'email' : '', user.value?.is_sms_notifications ? 'SMS' : ''].filter(Boolean).join(' and '))
</script>

<template>
  <section class="mx-auto mt-6 max-w-[680px] rounded-[18px] border border-line bg-white p-9 text-center">
    <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-note">
      <UIcon
        name="i-lucide-check"
        class="size-8 text-brand-600"
      />
    </div>
    <h1 class="display mt-4 mb-1.5 text-[34px]">
      Payment successful
    </h1>
    <p class="m-0 text-ink-600">
      Enrollment no. <strong class="text-ink-900">{{ user?.student?.reference_no }}</strong>
    </p>
    <p
      v-if="payment"
      class="mt-3.5 mb-0 text-ink-600"
    >
      We received {{ peso(payment.amount) }} via {{ payment.method_label }} (receipt {{ payment.reference_no }}). You’re enrolled — any remaining balance is payable when your training starts.
    </p>
    <p
      v-if="channels"
      class="mt-2 mb-0 text-ink-600"
    >
      A receipt was sent by {{ channels }}.
    </p>
    <p
      role="status"
      aria-live="polite"
      class="mt-5.5 mb-4.5 font-semibold"
    >
      {{ countdown > 0 ? `Redirecting to your dashboard in ${countdown}…` : 'Your dashboard is ready.' }}
    </p>
    <UButton
      :to="{ path: '/portal', query: { welcome: '1' } }"
      label="Go to my dashboard"
    />
  </section>
</template>
