// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@pinia/nuxt',
    'nuxt-auth-sanctum'
  ],

  devtools: {
    enabled: true
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s · MallSize Training Center',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#A3161A' }
      ],
      link: [{ rel: 'icon', href: '/favicon.ico' }]
    }
  },

  css: ['~/assets/css/main.css'],

  ui: {
    colorMode: false
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8080'
    }
  },

  // Portal, back office and the enrollment wizard are signed-in, app-like
  // screens: render them on the client only.
  routeRules: {
    '/portal/**': { ssr: false },
    '/admin/**': { ssr: false },
    '/register/**': { ssr: false },
    '/payments/**': { ssr: false }
  },

  compatibilityDate: '2026-06-30',

  // nitropack 2.13 + rolldown traces pnpm-store dependencies to broken
  // absolute paths ("/consola@3.4.2/…"); bundle them into the server instead.
  nitro: {
    noExternals: true
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: {
    families: [
      { name: 'Poppins', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Anton', provider: 'google', weights: [400] }
    ]
  },

  sanctum: {
    baseUrl: 'http://localhost:8080',
    mode: 'cookie',
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/login',
      logout: '/logout',
      user: '/api/v1/user'
    },
    redirectIfAuthenticated: false,
    redirectIfUnauthenticated: false,
    redirect: {
      keepRequestedRoute: true,
      onLogin: false,
      onLogout: '/',
      onAuthOnly: '/login',
      onGuestOnly: '/'
    }
  }
})
