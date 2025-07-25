
# Environment Variables for OptiRFP

This document outlines all environment variables required for the proper functioning of the OptiRFP application in different environments.

## Core Environment Variables

### Supabase Configuration
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgres://postgres:postgres@db.your-project.supabase.co:5432/postgres
```

### AI Service Providers
```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Email Services
```
RESEND_API_KEY=your-resend-api-key
EMAIL_WEBHOOK_SECRET=your-webhook-secret-key
```

### Payment Processing
```
STRIPE_API_KEY=your-stripe-public-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

## Development Environment

In addition to the core variables, development environments should include:

```
NODE_ENV=development
VITE_DEV_MODE=true
VITE_ENABLE_TEST_FEATURES=true
VITE_API_MOCKING=true
```

## Testing Environment

For testing purposes, these additional variables are recommended:

```
NODE_ENV=test
VITE_TEST_USER_EMAIL=test@example.com
VITE_TEST_USER_PASSWORD=test-password
VITE_MOCK_SUBSCRIPTION=pro
VITE_SKIP_PAYMENT=true
```

## Production Environment

Production environments should include:

```
NODE_ENV=production
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=your-sentry-dsn
VITE_MAX_UPLOAD_SIZE=50000000
VITE_RATE_LIMIT=100
```

## Feature Flags

Feature flags can be used to enable/disable specific features:

```
VITE_ENABLE_TEAM_FEATURES=false
VITE_ENABLE_EXPORT_FEATURES=true
VITE_ENABLE_ADVANCED_ANALYTICS=false
VITE_ENABLE_KNOWLEDGE_BASE=true
```

## Deployment-Specific Variables

### Vercel Deployment
```
VERCEL_URL=your-vercel-url
VERCEL_ENV=production
```

### Netlify Deployment
```
NETLIFY_SITE_URL=your-netlify-url
CONTEXT=production
```

## Security and Compliance

Security-related variables:

```
VITE_SESSION_TIMEOUT=3600
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_ENFORCE_MFA=false
VITE_CONTENT_SECURITY_POLICY=strict
```

## Notes on Environment Variables Usage

1. **Variable Prefix**: All client-side variables consumed by Vite must be prefixed with `VITE_`.

2. **Sensitive Information**: Never expose sensitive keys (like service role keys) to the frontend.

3. **Local Development**: Use a `.env.local` file for local development (ensure this is git-ignored).

4. **Production Deployments**: Set variables through your deployment platform's environment variable interface.

5. **Type Definitions**: Update `vite-env.d.ts` when adding new environment variables to maintain type safety.

6. **Email Delivery**: The email system now sends to actual recipients in both development and production environments. No test mode redirection is used.
