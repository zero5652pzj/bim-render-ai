/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DATABASE_URL: string
  readonly VITE_MINIMAX_BASE_URL: string
  readonly VITE_MINIMAX_MODEL_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
