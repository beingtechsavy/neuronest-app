# Project Structure

## Root Directory
```
├── .env.local              # Environment variables (Supabase config)
├── .kiro/                  # Kiro AI assistant configuration
├── public/                 # Static assets (SVG icons)
├── src/                    # Source code
└── package.json            # Dependencies and scripts
```

## Source Code Organization (`src/`)

### App Router Structure (`src/app/`)
- **Next.js 14 App Router** - File-based routing
- **Route Groups**: `/calendar`, `/dashboard`, `/login`, `/settings`, `/signup`
- **Layout Files**: `layout.tsx` (root), `RootLayoutInner.tsx`
- **Global Styles**: `globals.css`
- **Root Page**: `page.tsx`

### Components (`src/components/`)
**Modal Components** (User interactions):
- `*Modal.tsx` - All modal dialogs (Add/Edit/Delete/Detail modals)

**Layout Components**:
- `SideBar.tsx`, `TopBar.tsx` - Navigation structure
- `WeeklyView.tsx` - Calendar display

**Feature Components**:
- `TaskBox.tsx`, `ChapterItem.tsx` - Data display
- `UnscheduledTasks.tsx` - Task management
- `EditDeleteIcons.tsx` - Action buttons

**Provider Components**:
- `SupabaseProvider.tsx`, `UserProvider.tsx` - Context providers

### Data Layer (`src/lib/`)
- `supabaseClient.ts` - Database client configuration

### Type Definitions (`src/types/`)
- `definitions.ts` - Single source of truth for data types
- Core entities: `Subject`, `Chapter`, `Task`

## Naming Conventions
- **Components**: PascalCase (e.g., `AddTaskModal.tsx`)
- **Files**: camelCase for utilities, PascalCase for components
- **Types**: PascalCase interfaces in `definitions.ts`
- **Database fields**: snake_case (e.g., `task_id`, `is_stressful`)

## Architecture Patterns
- **Component-based architecture** with reusable UI components
- **Provider pattern** for global state (Supabase, User context)
- **Modal-driven interactions** for CRUD operations
- **Type-safe data models** with centralized definitions