# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Next.js, port 3000)
npm run build    # production build
npm run lint     # ESLint
```

Database migrations (Drizzle + Supabase):
```bash
npx drizzle-kit generate   # generate migration from schema changes
npx drizzle-kit migrate    # apply migrations to DB
```

No test runner is configured. `@playwright/test` is installed as a devDependency but no test files exist yet.

## Environment

Requires `.env.local` with:
- `DATABASE_URL` — Postgres connection string (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials

## Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, Supabase Auth, TanStack Query, shadcn/ui components, Zod, React Hook Form, Recharts, PWA via `@ducanh2912/next-pwa`.

**Data layer:** Drizzle ORM talks directly to Postgres (`lib/db/index.ts`). Schema is in `lib/db/schema.ts` (tables: `trips`, `members`, `expenses`, `expense_splits`, `payments`). Migrations live in `supabase/migrations/`. Server actions in `server/actions/` handle all mutations — they authenticate via Supabase server client, verify trip ownership, then call `db` directly.

**Auth:** Supabase Auth with SSR helpers. `lib/supabase/server.ts` creates a server-side client; `lib/supabase/client.ts` creates a browser client. The `(auth)` route group holds the login page; `(shell)` holds authenticated pages. Auth callback lives at `app/auth/callback/`.

**Route groups:**
- `app/(auth)/` — unauthenticated pages (login)
- `app/(shell)/` — authenticated shell with sidebar/bottom-nav layout; all trip routes live here under `/trips/[id]/{expenses,members,settle}`

**Page data flow:** Server components fetch data directly via `db` and pass it as props to client components. Mutations go through `'use server'` actions which call `revalidatePath` to bust the cache. TanStack Query is available on the client (configured in `components/providers.tsx`) but most data fetching currently happens server-side.

**Settlement logic:** `lib/settlement.ts` exports `computeBalances` and `simplifyDebts` — pure functions that calculate who owes whom given expenses, splits, and payments.

**UI components:** `components/ui/` contains shadcn/ui primitives. Feature components are organized by domain: `components/trips/`, `components/expenses/`, `components/members/`, `components/settlement/`, `components/dashboard/`, `components/shell/`.

**Path alias:** `@/` maps to the repo root (configured in `tsconfig.json`).
