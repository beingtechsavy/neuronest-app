# Technology Stack

## Framework & Runtime
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## Backend & Database
- **Supabase** - Backend-as-a-Service
  - Authentication via `@supabase/auth-helpers-nextjs`
  - Database client via `@supabase/supabase-js`
  - SSR support via `@supabase/ssr`

## Interactive Features
- **@dnd-kit** - Drag and drop functionality

## Development Tools
- **ESLint** - Code linting with Next.js and TypeScript rules
- **TypeScript** - Static type checking

## Common Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Setup
- Requires `.env.local` with Supabase configuration
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Build Configuration
- Uses Next.js App Router (not Pages Router)
- TypeScript path mapping: `@/*` maps to `./src/*`
- Tailwind configured for `src/` directory structure