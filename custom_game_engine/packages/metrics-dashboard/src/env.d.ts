/** Vite import.meta.env type declarations */
interface ImportMetaEnv {
  readonly VITE_PLANET_SERVER_URL?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
