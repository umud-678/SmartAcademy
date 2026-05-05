/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** İmzalı sessiya tokenı üçün gizli açar (mühitdə mütləq təyin edin). */
  readonly VITE_AUTH_JWT_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
