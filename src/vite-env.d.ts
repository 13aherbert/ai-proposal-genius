
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA4_MEASUREMENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  featureCache?: Map<string, boolean>;
  projectLimitCache?: Map<string, number>;
  gtag?: (...args: any[]) => void;
  dataLayer?: any[];
}
