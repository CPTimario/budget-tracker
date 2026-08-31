# Masa

A PWA for tracking shared travel expenses. Create trips, add members, log expenses (personal or split), and calculate who owes whom with automatic debt simplification.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** — Auth + Postgres
- **Drizzle ORM** — schema, queries, and migrations
- **TanStack Query** — client-side caching
- **Zod** + **React Hook Form** — form validation
- **Recharts** — charts and data visualization
- **PWA** via `@ducanh2912/next-pwa`

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

### 3. Run migrations

```bash
npm run db:migrate
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
| `npm run db:push` | Push schema changes directly (dev) |
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio |
