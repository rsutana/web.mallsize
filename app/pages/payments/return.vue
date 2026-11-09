<script setup lang="ts">
definePageMeta({ layout: 'register', middleware: ['sanctum:auth', 'role'], roles: ['student'] })
useSeoMeta({ title: 'Confirming payment' })

const checkout = useCheckout()
const toast = useToast()
const message = ref('Confirming your payment with the provider. Please don’t close this page.')

onMounted(async () => {
  const id = checkout.takePendingPaymentId()
  if (!id) {
    await navigateTo('/portal/payments')
    return
  }

  const payment = await checkout.waitForResult(id, 10, 2000).catch(() => null)

  if (payment && (payment.status === 'paid' || payment.status === 'verified')) {
    useRegistrationStore().$reset()
    await navigateTo({ path: '/register/success', query: { payment: id } })
    return
  }

  if (payment?.status === 'pending') {
    message.value = 'Your payment is still being confirmed. We’ll update your balance as soon as it goes through.'
    toast.add({ title: 'Payment pending', description: message.value, color: 'neutral', icon: 'i-lucide-clock' })
  } else {
    toast.add({ title: 'Payment didn’t go through', description: payment?.failure_reason ?? 'Please try again or use another method.', color: 'error', icon: 'i-lucide-circle-alert' })
  }
  await navigateTo('/portal/payments')
})
</script>

<template>
  <div class="mx-auto mt-10 max-w-[560px]">
    <PaymentProcessing :text="message" />
  </div>
</template>
