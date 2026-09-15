/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Flowboard API. See `.env.example`. */
  readonly VITE_API_BASE_URL: string
  /**
   * Deployment environment, baked in at build time by the Docker build-arg of
   * the same name. Absent in local `pnpm dev` runs — treated as `development`.
   */
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
