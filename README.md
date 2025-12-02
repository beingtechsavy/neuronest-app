This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure your environment variables:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual credentials. **Never commit this file to git.**

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
