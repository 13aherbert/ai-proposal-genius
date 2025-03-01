
/// <reference types="vite/client" />

/**
 * Environment Variables Documentation
 * 
 * Core Variables:
 * - VITE_SUPABASE_URL: URL of the Supabase project
 * - VITE_SUPABASE_ANON_KEY: Anon/Public key for Supabase authentication
 * 
 * Feature Flags:
 * - VITE_ENABLE_TEST_FEATURES: Enables testing features in development
 * - VITE_MOCK_SUBSCRIPTION: Mock a subscription plan ('trial', 'starter', 'pro')
 * - VITE_ENABLE_TEAM_FEATURES: Enables collaborative team features
 * 
 * See /src/docs/EnvironmentVariables.md for complete documentation
 */

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ENABLE_TEST_FEATURES?: string;
  readonly VITE_MOCK_SUBSCRIPTION?: 'trial' | 'starter' | 'pro';
  readonly VITE_ENABLE_TEAM_FEATURES?: string;
  readonly VITE_MAX_UPLOAD_SIZE?: string;
  readonly VITE_ANALYTICS_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
