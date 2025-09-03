# Project Structure

## Root Directory
- **`.env.local`** - Environment variables (Supabase credentials)
- **`next.config.js`** - Next.js configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration with path aliases (`@/*` → `./src/*`)
- **`package.json`** - Dependencies and scripts

## Source Structure (`src/`)

### App Router (`src/app/`)
Next.js 14 App Router structure with route-based organization:
- **`layout.tsx`** - Root layout with global providers
- **`page.tsx`** - Home page
- **`globals.css`** - Global styles and Tailwind imports
- **Route directories**: `calendar/`, `dashboard/`, `login/`, `settings/`, `signup/`, `tasks/`

### Components (`src/components/`)
Reusable UI components organized by functionality:
- **Modals**: `*Modal.tsx` files for overlays and dialogs
- **UI Components**: `TopBar.tsx`, `SideBar.tsx`, `TaskBox.tsx`, etc.
- **Providers**: `SupabaseProvider.tsx` for authentication context
- **Task Management**: `TaskList.tsx`, `TaskItem.tsx`, `TaskFilters.tsx`
- **Calendar**: `WeeklyView.tsx`, `DayViewModal.tsx`

### Library (`src/lib/`)
- **`supabaseClient.ts`** - Supabase client configuration

### Types (`src/types/`)
TypeScript type definitions:
- **`definitions.ts`** - Core data models (Subject, Chapter, Task)
- **`tasks.ts`** - Task-specific types with relations

## Naming Conventions
- **Components**: PascalCase (e.g., `TopBar.tsx`, `AddTaskModal.tsx`)
- **Files**: camelCase for utilities, PascalCase for components
- **Directories**: lowercase with hyphens for routes (e.g., `signup/`)

## Architecture Patterns
- **Client Components**: Use `'use client'` directive for interactive components
- **Server Components**: Default for static content and data fetching
- **Custom Hooks**: Component-level state management with React hooks
- **Supabase Integration**: Auth helpers for session management
- **Modal Pattern**: Centralized modal components with open/close state management