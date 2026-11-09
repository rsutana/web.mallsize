<script setup lang="ts">
useSeoMeta({
  title: 'Butchery & meat processing training',
  description: 'MallSize Training Center is a TESDA-accredited Technical Vocational Institution in the Davao Region. Enroll in hands-on meat processing courses.',
  ogImage: '/images/hero-banner.png'
})
</script>

<template>
  <UApp :toaster="{ position: 'top-center' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
