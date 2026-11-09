import { defineStore } from 'pinia'
import type { Enrollment, Payment, StudentDashboard } from '~/types'

/**
 * Student portal data shared by the dashboard, courses and payments pages
 * (and the sidebar badge). Call `refresh()` after a payment.
 */
export const usePortalStore = defineStore('portal', () => {
  const api = useApi()
  const dashboard = ref<StudentDashboard | null>(null)
  const payments = ref<Payment[]>([])
  const loading = ref(false)

  const enrollments = computed<Enrollment[]>(() => dashboard.value?.enrollments ?? [])
  const unpaid = computed(() => enrollments.value.filter(e => e.balance > 0))

  async function refresh() {
    loading.value = true
    try {
      const [d, p] = await Promise.all([
        api.get<StudentDashboard>('/student/dashboard'),
        api.get<Payment[]>('/student/payments')
      ])
      dashboard.value = d
      payments.value = p
    } finally {
      loading.value = false
    }
  }

  function reset() {
    dashboard.value = null
    payments.value = []
  }

  return { dashboard, payments, enrollments, unpaid, loading, refresh, reset }
})
