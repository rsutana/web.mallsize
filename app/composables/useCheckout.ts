import type { Checkout, NextAction, Payment, PaymentConfig } from '~/types'

export interface CardDetails {
  first: string
  last: string
  number: string
  expiry: string
  cvv: string
}

export interface CheckoutItem {
  enrollment_id: number
  amount_type: 'down_payment' | 'full' | 'custom'
  amount?: number
}

const PENDING_KEY = 'mallsize.pending-payment'

/**
 * Starts payments and follows the gateway's next action. Amounts are sent
 * as intents (down payment / full / custom) and validated by the API.
 */
export function useCheckout() {
  const api = useApi()
  const config = useState<PaymentConfig | null>('payment-config', () => null)

  async function loadConfig() {
    config.value ??= await api.get<PaymentConfig>('/payment-config')
    return config.value
  }

  /**
   * @returns the payment when it finished here, or the QR next action to show.
   * Redirect actions leave the page.
   */
  async function pay(items: CheckoutItem[], method: string, card?: CardDetails): Promise<{ payment: Payment, qr: NextAction | null }> {
    const cfg = await loadConfig()
    let paymentMethodId: string | undefined

    if (method === 'card' && card) {
      paymentMethodId = cfg.driver === 'paymongo' && cfg.public_key
        ? await createPayMongoCard(cfg.public_key, card)
        : fakeCardToken(card)
    }

    const result = await api.post<Checkout>('/student/payments', { items, method, payment_method_id: paymentMethodId } as Record<string, unknown>)

    if (result.next_action?.type === 'redirect' && result.next_action.url) {
      sessionStorage.setItem(PENDING_KEY, String(result.payment.id))
      window.location.href = result.next_action.url
      await new Promise(() => {})
    }

    return { payment: result.payment, qr: result.next_action?.type === 'qr' ? result.next_action : null }
  }

  async function status(paymentId: number) {
    return api.get<Payment>(`/student/payments/${paymentId}`)
  }

  /** Poll until the gateway settles the payment (or we give up). */
  async function waitForResult(paymentId: number, tries = 20, delayMs = 3000): Promise<Payment> {
    let payment = await status(paymentId)
    for (let i = 0; i < tries && payment.status === 'pending'; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      payment = await status(paymentId)
    }
    return payment
  }

  function takePendingPaymentId(): number | null {
    const id = Number(sessionStorage.getItem(PENDING_KEY))
    sessionStorage.removeItem(PENDING_KEY)
    return Number.isFinite(id) && id > 0 ? id : null
  }

  return { config, loadConfig, pay, status, waitForResult, takePendingPaymentId }
}

/** Fake gateway: card number 4000 0000 0000 0002 simulates a decline. */
function fakeCardToken(card: CardDetails): string {
  return card.number.replace(/\D/g, '') === '4000000000000002' ? 'pm_fake_declined' : 'pm_fake_card'
}

/**
 * Card details go straight from the browser to PayMongo with the public key;
 * only the resulting payment method id reaches our API.
 */
async function createPayMongoCard(publicKey: string, card: CardDetails): Promise<string> {
  const [mm, yy] = card.expiry.split('/')
  const res = await $fetch<{ data: { id: string } }>('https://api.paymongo.com/v1/payment_methods', {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${publicKey}:`)}` },
    body: {
      data: {
        attributes: {
          type: 'card',
          details: {
            card_number: card.number.replace(/\D/g, ''),
            exp_month: Number(mm),
            exp_year: 2000 + Number(yy),
            cvc: card.cvv
          },
          billing: { name: `${card.first} ${card.last}`.trim() }
        }
      }
    }
  }).catch((e: { data?: { errors?: { detail?: string }[] } }) => {
    throw Object.assign(new Error(e?.data?.errors?.[0]?.detail ?? 'Card details were not accepted.'), { status: 422, data: { message: e?.data?.errors?.[0]?.detail ?? 'Card details were not accepted.' } })
  })
  return res.data.id
}
