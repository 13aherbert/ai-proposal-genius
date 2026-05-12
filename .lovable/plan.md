## Root cause

In the previous fix to `supabase/functions/_shared/sso.ts` → `requireOrgAdmin`, a stray line was left behind:

```ts
if (sysRole) return { userId };
if (isSysAdmin === true) return { userId };   // ← undefined identifier
```

`isSysAdmin` no longer exists, so the edge function fails to compile and the previously-deployed (pre-fix) version keeps serving requests — which still rejects `system_admin` users with `Forbidden — owner or admin required`.

The signed-in user (`db89b55d-…`) does have the `system_admin` role in `user_roles`, confirming the bypass logic is correct — it just isn't running.

## Fix

1. Remove the stray `if (isSysAdmin === true) return { userId };` line in `supabase/functions/_shared/sso.ts`.
2. Redeploy the affected edge functions (`sso-health-check`, `sso-set-client-secret`, `sso-oidc-callback`, `sso-oidc-init`, `sso-auth-callback`, `manage-sso-config`, `provision-sso-provider`, `check-sso-domain`) so they pick up the updated `_shared/sso.ts`.
3. Verify by refreshing `/admin/security` — the SSO Diagnostics card should load the readiness checklist instead of the 403.

No DB changes, no UI changes.