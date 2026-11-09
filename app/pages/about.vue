<script setup lang="ts">
useSeoMeta({ title: 'About' })
const site = useAppConfig().site
const stats = [
  { value: site.stats.graduates, label: 'Graduates trained' },
  { value: site.stats.years, label: 'Years in operation' },
  { value: 'TESDA', label: 'Accredited TVI' },
  { value: 'Davao', label: 'Region XI' }
]
</script>

<template>
  <section class="mx-auto flex max-w-[1240px] flex-wrap gap-10 px-6 pt-12 pb-16">
    <div class="flex-[1_1_520px]">
      <h1 class="display m-0 mb-4 text-[44px]">
        About MallSize
      </h1>
      <p class="m-0 mb-4 text-[17px] leading-[1.7]">
        MallSize Training Center is a TESDA-accredited Technical Vocational Institution (TVI) in the Davao Region, committed to providing quality technical education and skills training.
      </p>
      <p class="m-0 mb-4 text-[17px] leading-[1.7]">
        As a recognized TVI, we uphold TESDA standards to ensure that every trainee receives professional, hands-on learning guided by experienced trainers and industry practitioners.
      </p>
      <p class="m-0 text-[17px] leading-[1.7] font-semibold text-brand-600">
        {{ site.tagline }}
      </p>
    </div>
    <div class="grid flex-[1_1_340px] grid-cols-2 content-start gap-3.5">
      <div
        v-for="s in stats"
        :key="s.label"
        class="rounded-[14px] border border-line bg-white p-5"
      >
        <div class="text-[28px] font-bold text-brand-600">
          {{ s.value }}
        </div>
        <div class="text-sm text-ink-600">
          {{ s.label }}
        </div>
      </div>
    </div>
  </section>
</template>
