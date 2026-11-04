# Pre-marketing hardening

Every open item from the 2026-11-04 ship gate, in the order to do it.
Phases 0–2 are the marketing blockers. Phase 3 is optional. Phase 4 must not
block marketing. Phase 5 is written down so it stops being an open question.

---

## Phase 0 — Database (do first, 5 minutes)

The only shipping blocker that touches production data.

### 0.1 Apply the pending migration

`docs/migrations/20261103_donations_dedupe.sql` — **applied 2026-11-04, verified**.
It contains four changes: `supporters.currency` default `INR`, the wall ordering
index, RLS on `supporters`, and the retry-duplicate gate in `apply_razorpay_event`.

Then apply `docs/migrations/20261104_revoke_table_privileges.sql`. Supabase grants
`ALL` on new public tables to `anon`, so `20261029`'s narrower revoke left
`TRUNCATE` on `supporters` — which RLS does not filter. Anyone with the public
anon key could empty the wall.

Supabase dashboard → SQL Editor → paste the whole file → Run.
The file is wrapped in `begin; … commit;`, so it is all-or-nothing.

Verify with:

```sql
-- expect: 'INR'::text
select column_default from information_schema.columns
where table_name = 'supporters' and column_name = 'currency';

-- expect: rowsecurity = true
select relrowsecurity from pg_class where relname = 'supporters';

-- expect: one row, prosecdef = true
select proname, prosecdef from pg_proc
where proname = 'apply_razorpay_event';
```

### 0.2 Prove the duplicate gate

Two deliveries of the same event id must produce one supporter row.
Run twice, substituting a real event id from `payment_events`:

```sql
select apply_razorpay_event('<existing-event-id>', '<that-event-json>'::jsonb);
```

Second call returns `{"duplicate":true}` and inserts nothing.
If the first call already ran in production, use a fresh test event from the
Razorpay dashboard → Webhooks → Send test webhook.

---

## Phase 1 — Repository, ~45 minutes

All safe, no behaviour change beyond the stated fix.

### 1.1 Cap the unbounded breakdown list

`src/app/api/ai/breakdowns/list/route.ts:45`

```ts
      .order('created_at', { ascending: false })
      .limit(200);
```

200 is well above any real account; it only stops the endpoint from serialising
an unbounded `ai_breakdowns` table.

### 1.2 Health endpoint

New file `src/app/api/health/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/payments/entitlements';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, db: 'unconfigured' }, { status: 503 });
  }
  const { error } = await supabase
    .from('supporters')
    .select('id', { count: 'exact', head: true })
    .limit(1);

  return NextResponse.json(
    { ok: !error, db: error ? 'error' : 'ok' },
    { status: error ? 503 : 200 },
  );
}
```

Point the uptime monitor (2.4) at `https://www.neuronest.work/api/health`.

### 1.3 robots.txt

New file `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/api/'] }],
    sitemap: 'https://www.neuronest.work/sitemap.xml',
  };
}
```

### 1.4 sitemap.xml

New file `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { SEO_TASKS } from '@/data/seoTasks';

const BASE = 'https://www.neuronest.work';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ['', '/pricing', '/privacy', '/terms', '/rescue'];
  return [
    ...staticPages.map((path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      priority: path === '' ? 1 : 0.7,
    })),
    ...SEO_TASKS.map((task) => ({
      url: `${BASE}/start/${task.slug}`,
      lastModified: new Date(),
      priority: 0.8,
    })),
  ];
}
```

Confirm the `SeoTaskConfig` field is `slug` (`src/data/seoTasks.ts:14`).

### 1.5 Security headers

Replace the empty `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://api.openrouter.ai https://api.resend.com",
              "frame-src https://api.razorpay.com https://checkout.razorpay.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

`'unsafe-inline' 'unsafe-eval'` in `script-src` is deliberate — Next.js and
Razorpay Checkout both need it without a nonce pipeline. Everything else
(`frame-ancestors`, `base-uri`, `form-action`, `connect-src`, `frame-src`) is
the part that actually blocks attacks. Removing `unsafe-inline` means building a
nonce-based CSP through middleware; treat that as its own task, not a blocker.

**Verify after deploy:** hard-reload the home page, `/pricing`, `/dashboard`, and
run one donation checkout to the Razorpay modal. If the modal is blocked, add the
`*.razorpay.com` host it names in the console error to `frame-src` and
`script-src`.

### 1.6 Mark the two intentional empty catches

Not bugs — they are deliberate fallbacks, but a reader cannot tell.

`src/components/WeeklyView.tsx:103`
```ts
  } catch {
    // Invalid timestamps fall back to the default 1-row span. Intentional.
  }
```

`src/lib/rescue/anonymousSession.ts:153`
```ts
    } catch {
      // Analytics is best-effort; account creation must not fail on it.
    }
```

---

## Phase 2 — Vercel, Supabase, and money decisions (~45 min + decisions)

### 2.1 Environment variables in Production

Vercel → Project → Settings → Environment Variables → **Production**.
Cross-check every name below is present. A missing one is a silent 503, not a
crash.

| Variable | Scope | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | yes |
| `OPENROUTER_API_KEY` | Server | yes |
| `OPENROUTER_MODEL` | Server | yes |
| `OPENROUTER_FALLBACK_MODEL` | Server | yes |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public | yes |
| `RAZORPAY_KEY_SECRET` | Server | yes |
| `RAZORPAY_WEBHOOK_SECRET` | Server | yes |
| `RESEND_API_KEY` | Server | yes |
| `NEXT_PUBLIC_APP_URL` | Public | yes |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Public | yes |
| `NEXT_PUBLIC_PRIVACY_EMAIL` | Public | yes |
| `BUYMEACOFFEE_WEBHOOK_SECRET` | Server | required if BMC auto-sync is on |
| `DONATION_CURRENCY` | Server | optional, defaults INR |
| `RAZORPAY_PRO_PLAN_ID_MONTHLY` / `_YEARLY` | Server | only if subscriptions are live |
| `ELEVENLABS_*` | Server | only for video narration |

Rule that must never break: nothing secret gets a `NEXT_PUBLIC_` prefix.
`NEXT_PUBLIC_RAZORPAY_KEY_ID` is a publishable id, not a secret — that one is fine.

### 2.2 Backups

Supabase free tier has **no automated backups**. Two options:

- **Pro ($25/mo)** — daily backups, 7-day retention, PITR as an add-on. Zero work.
- **Free** — a GitHub Action that runs `pg_dump` nightly to Cloudflare R2
  (10 GB free). ~30 min to set up, and you own the restore path.

Pick one before marketing. "No backups" is the single largest uninsured risk in
the list — it is the only finding that loses user data permanently.

### 2.3 Restore test (do this once, then quarterly)

A backup nobody restored is a hypothesis. Restore the latest dump into a scratch
Supabase project, connect a local build to it, sign in, open `/dashboard`.
Record the date in this file. If it takes more than an hour, the backup is wrong.

### 2.4 Uptime monitoring

UptimeRobot free → HTTP(s) monitor on `https://www.neuronest.work/api/health`,
5-minute interval, keyword check `"ok":true`, alert to email + phone.

### 2.5 Domain and HTTPS

Vercel → Domains. Both `neuronest.work` and `www.neuronest.work` must resolve,
with one issuing a 308 redirect to the other. `metadataBase` in
`src/app/layout.tsx:16` is `https://www.neuronest.work`, so **www must be the
canonical host** — set `neuronest.work` → 308 → `www.neuronest.work`, not the
reverse, or every OG image and canonical URL points at a redirect.

Check: `curl -sI https://neuronest.work | head -3` returns `308` with
`location: https://www.neuronest.work/`.

### 2.6 Rollback plan

Write these three lines somewhere you will find them at 2am:

1. Code: Vercel → Deployments → previous good deploy → **Promote to Production**. Instant, no rebuild.
2. Database: every migration here is additive and idempotent. There is no down-migration — roll forward with a new file. Never `drop` a column that a live deploy still reads.
3. Payments: disable checkout by unsetting `RAZORPAY_KEY_SECRET` in Production. The donation and order routes return 503; the wall keeps rendering.

---

## Phase 3 — Error monitoring, 20 minutes

`npx @sentry/wizard@latest -i nextjs` in the repo, free tier, then:

- Vercel env: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`.
- Alert rule: email on every new issue, Slack on `error` level.
- Confirm `payment_events` payloads are not captured: the wizard adds
  `beforeSend`; make sure it drops `payload.data.supporter_email` and
  `payload.payment.entity.email`.

Skip entirely if the 20 minutes is better spent on marketing — but then 2.4
becomes mandatory, because otherwise the first signal you get about a broken
payment is a support email.

---

## Phase 4 — Next 16 upgrade (half a day, NOT a marketing blocker)

`npm audit` reports one critical, and every 14.2.x is in range. The advisories
are DoS, cache-poisoning, and RCE on *self-hosted Windows* servers. On Vercel the
RCE entries do not apply; the DoS ones are edge-absorbed. This is why it does not
block launch.

Do it as its own session, on a branch, with nothing else open:

1. `git checkout -b chore/next-16`
2. `npm i next@16 react@19 react-dom@19 eslint-config-next@16`
3. `npx @next/codemod@latest next-async-request-api .`
   — `params`, `searchParams`, `cookies()`, `headers()` become Promises.
   This app has `params.slug` in `src/app/start/[slug]/page.tsx` (lines 11, 23, 59).
4. `npx tsc --noEmit && npm test && npm run build`
5. Manual pass: `/`, `/pricing`, one Razorpay donation, `/dashboard`, `/rescue`.

Budget half a day. If step 3 opens more than ~10 files, stop and defer — it is
not worth risking the marketing window.

---

## Phase 5 — Risks accepted on purpose

Written down so they stop reappearing in every audit.

| Item | Why it stays |
|---|---|
| Razorpay raw payload in `payment_events` contains payer `email`/`contact` | Service-role-only table, RLS on, encrypted at rest. It is the audit trail for refunds and chargebacks. Redacting it means an unanswerable support ticket. |
| `script-src 'unsafe-inline' 'unsafe-eval'` in CSP | Next.js + Razorpay Checkout require it without a nonce pipeline. Nonce CSP = separate task. |
| No pagination on `/api/ai/breakdowns/list` | Capped at 200 in 1.1; real accounts have dozens. |
| BMC concurrent duplicate: two deliveries of the same event inside the same millisecond can both insert a wall row | `payment_events` upsert does not lock. Window is milliseconds; BMC retries are minutes apart. Fixing it needs a transaction or a unique index that would false-positive on legitimate repeat donors. |
| `donation.refunded` leaves the donor on the wall | `supporters` stores no payment id by design (privacy). Adding one re-introduces the link the table deliberately omits. Handle manually if it ever happens. |

---

## The short version

Do Phase 0 today (5 min). Do Phase 1 in one sitting (45 min). Do 2.2 and 2.4
before the first marketing push — backups and uptime are the only two items whose
absence can cost you data or weeks. Everything else can wait until the first
paying user.
