This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Environment Setup

For a new local setup, copy the public placeholder template `.env.example` to `.env.local` only if `.env.local` does not already exist:

```bash
cp -n .env.example .env.local
```

Then replace the placeholders in your private environment file with your actual credentials. If you already have a private `.env` or `.env.local`, update the relevant variables there instead of overwriting it or creating conflicting values. **Never commit either private file to git.** Configure the same variables separately in the deployment environment.

The AI task-breakdown route uses OpenRouter with a low-cost paid primary and a free fallback. Set all three variables explicitly:

```env
OPENROUTER_API_KEY=<server-only-openrouter-api-key>
OPENROUTER_MODEL=deepseek/deepseek-v4.1-flash-1017
OPENROUTER_FALLBACK_MODEL=liquid/lfm-2.5-2.6b:free
```

- **Primary:** DeepSeek V4.1 Flash 1017, selected for low per-token cost and broader provider availability.
- **Model fallback:** DeepSeek R1 (free). The app supplies the primary and fallback model IDs in priority order to OpenRouter; OpenRouter can try the fallback when the primary returns an error, and the app also retries the validated fallback for provider errors.
- **Provider fallback:** OpenRouter's upstream-provider retries are separate from changing models. Its default provider routing can try other eligible providers for a selected model, subject to account routing/privacy settings and endpoint availability. There is no separate provider-fallback environment variable in this app.
- **Cost safety:** The fallback must retain `:free`. The app only permits the configured DeepSeek V4.1 Flash primary or another free primary; arbitrary paid models and paid fallbacks are rejected before a request is sent.
- **Availability:** The paid primary still depends on upstream provider availability, while the R1 free fallback has shared-capacity and rate-limit constraints. The application validates JSON locally after receiving the response, and the request fails clearly if neither model can serve it.

Keep `OPENROUTER_API_KEY` server-only; never give it a `NEXT_PUBLIC_` prefix. `OPENROUTER_SITE_URL` and `OPENROUTER_APP_NAME` are optional attribution values, not credentials or provider selectors. See `.env.example` for the Supabase variables and other integrations, and `neuronest-inputs-needed.md` for production checks.

### 2. Security Check

Before running the app, verify your security configuration:

```bash
npm run security-check
```

### 3. Run Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🔒 Security

This project follows strict security practices:

- **Environment variables** are never committed to git
- **Service role keys** are only used server-side in API routes
- **Sensitive keys** are never exposed to the browser
- **Automatic security checks** run before each build

For detailed security guidelines, see [SECURITY.md](./SECURITY.md).

### Quick Security Verification

```bash
npm run security-check
```

This will verify:
- ✅ `.env.local` is not tracked by git
- ✅ No sensitive keys have `NEXT_PUBLIC_` prefix
- ✅ Service role key is not used in client-side code
