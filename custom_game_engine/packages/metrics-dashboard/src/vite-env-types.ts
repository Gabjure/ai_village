/** Vite import.meta.env type declarations for tsc --build composite mode */
/* eslint-disable @typescript-eslint/no-empty-interface */
declare interface ImportMetaEnv {
  readonly VITE_PLANET_SERVER_URL?: string;
  readonly [key: string]: string | undefined;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
