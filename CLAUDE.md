# CLAUDE.md — web.mallsize (Nuxt 4)

Stack: **Nuxt 4 · Vue 3 · TypeScript (strict) · Nuxt UI 4 · Tailwind CSS v4 · Pinia · nuxt-auth-sanctum 3 · zod 4 · Vitest**.

The website, enrollment wizard, student portal and staff/admin back office for
**MallSize Training Center**, consuming the Laravel API in `../api.mallsize` at `/api/v1`
with Sanctum **cookie** (SPA) authentication.

Design source of truth: `../ai-sources/artboards/*.html`
(1 public website · 2 registration & enrollment · 3 student login · 4 student portal · 5 staff/admin console).
Match layouts, copy and tokens from those files when building or changing screens.

## Map

```
app/
  app.vue / app.config.ts     UApp + toasts; Nuxt UI theme (primary=brand, secondary=accent) and `site` details
  assets/css/main.css         design tokens (@theme) + shared utilities: display, eyebrow, card, pill, tbl, chip, chip-on, note
  layouts/                    default (public header/footer) · auth (red split panel) · register · portal (white sidebar) · admin (dark sidebar)
  pages/                      public: index, courses, orientation, about, news/, gallery, contact
                              auth: login, staff/login, forgot-password, reset-password
                              enrollment: register/index (wizard), register/success, payments/return (gateway return)
                              portal/: index (dashboard), courses, payments, profile          → roles: ['student']
                              admin/: index, payments, students, news, orientations          → roles: ['staff', 'admin']
                              admin/: courses, locations                                     → roles: ['admin']
  components/{area}/Name.vue  auto-imported as <AreaName>: brand/, site/, auth/, enroll/, payment/, portal/, admin/, ui/
  composables/                useApi, useApiError, useCheckout, useLookups, useCurrentUser, useHydrated
  stores/                     registration (wizard), portal (dashboard + payments), admin (overview/badges)
  middleware/role.ts          enforces definePageMeta({ roles }) after `sanctum:auth`
  types/index.ts              mirrors API resources one for one
  utils/                      money (peso, toCentavos), dates, status (pillClass, slotTone)
```

## Rules

- **API access only through `useApi()`** (wraps `useSanctumClient`, sends cookies + XSRF header,
  prefixes `/api/v1`, unwraps `{ data }`). Never call `$fetch` against the API directly.
  The single exception is `useCheckout` → PayMongo card tokenization (browser → PayMongo with the
  **public** key, so card numbers never reach our API).
- **Auth**: `useSanctumAuth()` for login/logout/identity, `useCurrentUser()` for role helpers and the
  user's home (`/portal` or `/admin`). Protect pages with
  `definePageMeta({ layout, middleware: ['sanctum:auth', 'role'], roles: [...] })`.
  `redirect.onLogin` is `false`: the login form routes by role itself.
- **Money is integer centavos** in all API payloads and types. Display with `peso()`, convert typed
  pesos with `toCentavos()`. Totals in the UI are **previews**: the API recomputes amounts and
  enforces minimums. Send payment intents (`down_payment` / `full` / `custom`), never trusted totals.
- **Lookups, not hard-coded option lists**: statuses, categories, location types, sexes, education
  levels, etc. come from `useLookups()` (`GET /lookups`). Use `items(table)` for `USelect`,
  `label(table, code)` for display. Resources already include `*_label` fields; prefer those.
- **Forms**: `UForm` + zod schema + `UFormField`; map 422s with `useApiError().report()` →
  `form.setErrors(...)`. Disable submit until `useHydrated()` is true (an early click must not fall
  through to a native form post).
- **Errors**: `friendlyError()` turns any failure into a readable sentence; toasts via `useToast()`.
- **Accessibility**: touch targets ≥ 44px (buttons default to `size: 'lg'`), visible yellow focus ring,
  status never by colour alone (pills always show text; slot bars have labels), radio/checkbox groups
  have `role`/`aria-*` like the artboards, respect `prefers-reduced-motion`.
- **Styling**: Tailwind utilities + design tokens (`brand-*` red #A3161A = 600, `accent-*` yellow #F4B63A = 500,
  `ink-*`, `surface`, `line`, `ok`/`info`/`warn`/`bad`). Headings that are uppercase in the design use
  `display` (Anton). Add new shared classes as `@utility` in `main.css` (the lint rule rejects unknown classes).
- **Rendering**: public pages are SSR (`useAsyncData` + `useApi`); `/portal/**`, `/admin/**`,
  `/register/**`, `/payments/**` are client-only (`routeRules ssr: false`).
- **Types**: when an API resource changes, update `app/types/index.ts` in the same change.

## Payment flow (UI)

`PaymentMethods` (wallet tiles + card form) emits `pay(method, card?)` →
`useCheckout().pay(items, method, card)`:
- `next_action.type === 'redirect'` → store the payment id in sessionStorage and leave the page;
  PayMongo returns to `/payments/return`, which polls `GET /student/payments/{id}`.
- `next_action.type === 'qr'` → show the QR (`PaymentProcessing`) and poll.
- Fake driver (local): settles instantly; card `4000 0000 0000 0002` simulates a decline.

## Environment

`.env` (see `.env.example`): `NUXT_PUBLIC_SANCTUM_BASE_URL` **and** `NUXT_SANCTUM_BASE_URL`
(the module reads a private copy during SSR), `NUXT_PUBLIC_API_BASE`. This app's `host:port` must
be listed in the API's `SANCTUM_STATEFUL_DOMAINS` and `CORS_ALLOWED_ORIGINS`.

Seeded logins (password `password`): `admin@mallsize.ph`, `staff@mallsize.ph`, `juan.delacruz@email.com`.

## Verify before reporting done

```bash
pnpm lint          # eslint (Nuxt + better-tailwindcss correctness)
pnpm typecheck     # nuxt typecheck (strict)
pnpm test          # vitest: test/unit (node) + test/nuxt (nuxt env, happy-dom)
pnpm build         # production build
```

Smoke-test the build, not the dev server:

```bash
PORT=3100 NUXT_PUBLIC_SANCTUM_BASE_URL=http://localhost:8080 NUXT_SANCTUM_BASE_URL=http://localhost:8080 node .output/server/index.mjs
```

`nitro.noExternals: true` is deliberate: nitropack 2.13 + rolldown otherwise emits broken
pnpm-store import paths (`/consola@…/node_modules/…`) and every SSR request 500s.
