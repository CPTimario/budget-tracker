# Budget Tracker

A PWA for tracking shared travel expenses. Create trips, add members, log expenses (personal or split), and calculate who owes whom with automatic debt simplification.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** — Auth + Postgres
- **Drizzle ORM** — schema, queries, and migrations
- **TanStack Query** — client-side caching
- **Zod** + **React Hook Form** — form validation

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:

```
DATABASE_URL=<supabase-postgres-connection-string>
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-key>
```

### 3. Run migrations

```bash
npx drizzle-kit migrate
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit generate` | Generate migration from schema changes |
| `npx drizzle-kit migrate` | Apply pending migrations |
