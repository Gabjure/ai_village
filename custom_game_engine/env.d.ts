/** Vite import.meta.env type declarations for packages that use env vars at runtime */
interface ImportMetaEnv {
  readonly VITE_METRICS_WS_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_LLM_PROXY_URL?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
