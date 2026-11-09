<script setup lang="ts">
import type { CardDetails } from '~/composables/useCheckout'

const props = defineProps<{
  /** Amount to pay today, centavos (display only). */
  amount: number
  disabled?: boolean
  processing?: boolean
}>()

const emit = defineEmits<{ pay: [method: string, card?: CardDetails] }>()

const { config, loadConfig } = useCheckout()
onMounted(() => {
  loadConfig().catch(() => {})
})

const WALLET_COLORS: Record<string, string> = {
  maya: '#0A9F5A',
  qrph: '#1B3A8C',
  gcash: '#0B5CD6',
  shopeepay: '#C2410C'
}

const wallets = computed(() => (config.value?.methods ?? []).filter(m => m.code !== 'card'))
const wallet = ref<string | null>(null)
const walletLabel = computed(() => wallets.value.find(w => w.code === wallet.value)?.label ?? '')

const card = reactive<CardDetails>({ first: '', last: '', number: '', expiry: '', cvv: '' })
const cardTried = ref(false)

function digits(s: string) {
  return s.replace(/\D/g, '')
}

function onNumber(v: string) {
  card.number = digits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
  wallet.value = null
}

function onExpiry(v: string) {
  const d = digits(v).slice(0, 4)
  card.expiry = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  wallet.value = null
}

function onCvv(v: string) {
  card.cvv = digits(v).slice(0, 4)
  wallet.value = null
}

const cardErrors = computed(() => {
  const errs: string[] = []
  if (digits(card.number).length < 15) errs.push('a complete card number')
  const m = /^(\d{2})\/(\d{2})$/.exec(card.expiry)
  const now = new Date()
  const valid = m && Number(m[1]) >= 1 && Number(m[1]) <= 12
    && (2000 + Number(m[2]) > now.getFullYear() || (2000 + Number(m[2]) === now.getFullYear() && Number(m[1]) >= now.getMonth() + 1))
  if (!valid) errs.push('a valid expiry date (MM/YY)')
  if (card.cvv.length < 3) errs.push('the 3-digit CVV')
  return errs
})

const cardIncomplete = computed(() => !card.first.trim() || !card.last.trim() || !card.number || !card.expiry || !card.cvv)

function payWallet() {
  if (wallet.value) emit('pay', wallet.value)
}

function payCard() {
  cardTried.value = true
  if (cardErrors.value.length) return
  emit('pay', 'card', { ...card })
}

defineExpose({ reset: () => Object.assign(card, { first: '', last: '', number: '', expiry: '', cvv: '' }) })

const amountText = computed(() => peso(props.amount))
</script>

<template>
  <div>
    <section
      class="rounded-[14px] border border-[#E7E2E1] bg-white p-4.5 shadow-[0_2px_10px_rgba(28,20,20,.05)]"
      aria-labelledby="wallet-title"
    >
      <h3
        id="wallet-title"
        class="m-0 mb-3.5 text-base font-semibold"
      >
        QR and e-Wallets
      </h3>
      <div
        role="radiogroup"
        aria-label="QR and e-wallet options"
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,150px),1fr))] gap-2.5"
      >
        <button
          v-for="w in wallets"
          :key="w.code"
          type="button"
          role="radio"
          :aria-checked="wallet === w.code"
          class="flex min-h-13 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] bg-white px-3 py-2 text-[17px] font-bold transition"
          :class="wallet === w.code ? 'border-brand-600 shadow-[0_0_0_3px_rgba(163,22,26,.14)]' : 'border-[#E3DEDD] hover:border-[#C9B9B5]'"
          :style="{ color: WALLET_COLORS[w.code] }"
          :disabled="disabled || processing"
          @click="wallet = w.code"
        >
          {{ w.code === 'maya' ? 'maya' : w.label }}
        </button>
      </div>
      <template v-if="wallet">
        <UButton
          class="mt-3.5"
          block
          :label="`Pay ${amountText} with ${walletLabel}`"
          :disabled="disabled || processing"
          :loading="processing"
          @click="payWallet"
        />
        <p class="mt-2 mb-0 text-center text-xs text-ink-600">
          You’ll be sent to {{ walletLabel }} to approve the payment, then brought back here.
        </p>
      </template>
    </section>

    <div
      role="separator"
      class="my-4 flex items-center gap-3 text-xs text-ink-500"
    >
      <span class="h-px flex-1 bg-[#E3D8D5]" />Or pay using your debit/credit card<span class="h-px flex-1 bg-[#E3D8D5]" />
    </div>

    <section
      class="rounded-[14px] border border-[#E7E2E1] bg-white p-4.5 shadow-[0_2px_10px_rgba(28,20,20,.05)]"
      aria-labelledby="card-title"
    >
      <div class="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <h3
          id="card-title"
          class="m-0 text-base font-semibold"
        >
          Debit/Credit Card
        </h3>
        <span
          aria-label="Accepted cards: Mastercard, Visa, JCB"
          class="flex gap-1.5"
        >
          <span
            v-for="b in ['Mastercard', 'VISA', 'JCB']"
            :key="b"
            class="rounded-[5px] bg-[#F3EEEC] px-1.5 py-0.5 text-[10px] font-bold tracking-[.3px] text-ink-700"
          >{{ b }}</span>
        </span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <UFormField label="First name">
          <UInput
            v-model="card.first"
            autocomplete="cc-given-name"
            class="w-full"
            @update:model-value="wallet = null"
          />
        </UFormField>
        <UFormField label="Last name">
          <UInput
            v-model="card.last"
            autocomplete="cc-family-name"
            class="w-full"
            @update:model-value="wallet = null"
          />
        </UFormField>
        <UFormField
          label="Card number"
          class="col-span-2"
        >
          <UInput
            :model-value="card.number"
            inputmode="numeric"
            autocomplete="cc-number"
            placeholder="1234 5678 9012 3456"
            class="w-full"
            @update:model-value="onNumber(String($event))"
          />
        </UFormField>
        <UFormField label="Expiry date">
          <UInput
            :model-value="card.expiry"
            inputmode="numeric"
            autocomplete="cc-exp"
            placeholder="MM/YY"
            class="w-full"
            @update:model-value="onExpiry(String($event))"
          />
        </UFormField>
        <UFormField
          label="CVV"
          hint="3 digits on the back"
        >
          <UInput
            :model-value="card.cvv"
            type="password"
            inputmode="numeric"
            autocomplete="cc-csc"
            placeholder="3 digits"
            class="w-full"
            @update:model-value="onCvv(String($event))"
          />
        </UFormField>
      </div>
      <p
        v-if="cardTried && cardErrors.length"
        role="alert"
        class="mt-3 mb-0 text-[13px] font-medium text-brand-600"
      >
        Please enter {{ cardErrors.join(', ') }}.
      </p>
      <UButton
        class="mt-4"
        block
        :label="`Complete order · ${amountText}`"
        :disabled="cardIncomplete || disabled || processing"
        :loading="processing"
        @click="payCard"
      />
      <p class="mt-2 mb-0 text-center text-xs text-ink-600">
        Payments are processed securely by PayMongo. MallSize never stores your card details.
      </p>
    </section>
  </div>
</template>
