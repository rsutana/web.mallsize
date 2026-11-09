import { defineStore } from 'pinia'
import type { AdminOverview } from '~/types'

export const useAdminStore = defineStore('admin', () => {
  const api = useApi()
  const overview = ref<AdminOverview | null>(null)

  async function refreshOverview() {
    overview.value = await api.get<AdminOverview>('/admin/overview')
  }

  return { overview, refreshOverview }
})
