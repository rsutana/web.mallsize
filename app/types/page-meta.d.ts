import type { Role } from './index'

declare module '#app' {
  interface PageMeta {
    /** Roles allowed on this page. Use with the `sanctum:auth` and `role` middleware. */
    roles?: Role[]
  }
}

export {}
