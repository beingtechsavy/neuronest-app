# Security Guidelines

## Environment Variables Security

### Critical Security Rules

1. **NEVER commit `.env.local` to git** - It's already in `.gitignore`, keep it that way
2. **NEVER use `SUPABASE_SERVICE_ROLE_KEY` in client-side code** - Only use in API routes
3. **NEVER prefix sensitive keys with `NEXT_PUBLIC_`** - This exposes them to the browser
4. **ALWAYS rotate keys if accidentally exposed** - Better safe than sorry

### Key Classification

#### Public Keys (Safe for Client-Side)
These keys are prefixed with `NEXT_PUBLIC_` and are safe to expose in the browser:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (protected by RLS)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Razorpay public key
- `NEXT_PUBLIC_APP_URL` - Your app's public URL

#### Private Keys (Server-Side ONLY)
These keys must NEVER be exposed to the client:
- `SUPABASE_SERVICE_ROLE_KEY` - Full database admin access, bypasses RLS
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API access
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `RESEND_API_KEY` - Email service API key

### Where to Use Service Role Key

✅ **SAFE - Server-Side API Routes:**
```typescript
// src/app/api/*/route.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ Safe here
)
```

✅ **SAFE - Node.js Scripts:**
```javascript
// scripts/*.js (not bundled with client)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ✅ Safe here
)
```

❌ **UNSAFE - Client Components:**
```typescript
// src/components/*.tsx
'use client'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ❌ NEVER DO THIS
)
```

❌ **UNSAFE - Any Browser Code:**
```typescript
// Any file that runs in the browser
const key = process.env.SUPABASE_SERVICE_ROLE_KEY // ❌ NEVER DO THIS
```

### Production Deployment Checklist

Before deploying to production:

1. **Verify `.env.local` is NOT in git:**
   ```bash
   git ls-files .env.local
   # Should return empty
   ```

2. **Set environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all keys from `.env.local`
   - Mark sensitive keys as "Sensitive" (encrypted)

3. **Rotate keys if exposed:**
   - Supabase: Project Settings → API → Reset service_role key
   - Azure OpenAI: Regenerate keys in Azure Portal
   - Razorpay: Regenerate keys in Razorpay Dashboard
   - Resend: Create new API key and delete old one

4. **Enable RLS on all tables:**
   - Ensure Row Level Security is enabled
   - Service role key bypasses RLS, so proper policies are critical

5. **Audit API routes:**
   - Verify all routes validate user authentication
   - Check that service role operations are necessary
   - Consider using anon key + RLS where possible

### Key Rotation Procedure

If a key is accidentally exposed:

1. **Immediately rotate the key** in the service dashboard
2. **Update `.env.local`** with the new key
3. **Update Vercel environment variables**
4. **Redeploy the application**
5. **Monitor logs** for unauthorized access attempts
6. **Review git history** if key was committed

### Monitoring & Alerts

- Enable Supabase audit logs
- Set up alerts for unusual database activity
- Monitor API route usage patterns
- Review Vercel deployment logs regularly

## Reporting Security Issues

If you discover a security vulnerability, please email security@neuronest.work instead of using the issue tracker.
