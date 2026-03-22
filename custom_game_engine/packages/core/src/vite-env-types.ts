/** Vite import.meta.env type declarations for tsc --build composite mode */
/* eslint-disable @typescript-eslint/no-empty-interface */
declare interface ImportMetaEnv {
  readonly VITE_METRICS_WS_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_LLM_PROXY_URL?: string;
  readonly VITE_PLANET_SERVER_URL?: string;
  readonly [key: string]: string | undefined;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
