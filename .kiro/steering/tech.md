# Technology Stack

## Framework & Runtime
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **PostCSS** - CSS processing

## Backend & Database
- **Supabase** - Backend-as-a-Service
  - Authentication with email confirmation
  - PostgreSQL database
  - Real-time subscriptions
- **Supabase Auth Helpers** - Next.js integration

## Additional Libraries
- **@dnd-kit** - Drag and drop functionality
- **@vercel/analytics** - Analytics tracking

## Development Tools
- **ESLint** - Code linting
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
- Copy `.env.local` and configure Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Build System
- **Next.js** handles bundling, optimization, and deployment
- **Vercel** recommended for deployment
- TypeScript compilation integrated with Next.js build process