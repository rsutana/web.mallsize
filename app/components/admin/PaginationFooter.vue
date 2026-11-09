<script setup lang="ts">
import type { Paginated } from '~/types'

/** "Showing x–y of z" plus page controls for a paginated back-office table. */
defineProps<{ meta: Paginated<unknown>['meta'] }>()

const page = defineModel<number>('page', { required: true })
</script>

<template>
  <div
    v-if="meta.total"
    class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3.5 py-3"
  >
    <p class="m-0 text-sm text-ink-600">
      Showing {{ meta.from }}–{{ meta.to }} of {{ meta.total }}
    </p>
    <UPagination
      v-if="meta.last_page > 1"
      v-model:page="page"
      :total="meta.total"
      :items-per-page="meta.per_page"
      show-edges
    />
  </div>
</template>
