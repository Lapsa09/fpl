# AGENTS.md — Liga FPL

Next.js 15 + React 19 + Tailwind 4 + Prisma 7 (PostgreSQL) + UploadThing. Single-package app; `pnpm-workspace.yaml` only sets `allowBuilds`, not a monorepo.

## Commands (npm is canonical; README uses `npm`/`npx`)

- `npm install` → copy `.env.example` to `.env` → `npx prisma db push` → `npm run dev`. No hay seed: los datos se cargan manualmente desde el admin.
- `npm test` = `vitest run`. Single file: `npx vitest run src/lib/domain/standings.test.ts`. Watch: `npm run test:watch`
- `npm run lint` (`next lint`), `npm run build`, `npm start`
- DB: `npm run db:generate` (`prisma generate`), `npm run db:push`
- Tests only match `src/**/*.test.ts`, node env, `@/` alias via `vite-tsconfig-paths` (`vitest.config.ts`)

## Prisma / DB gotchas

- No migrations directory — schema changes ship via `prisma db push`, never `prisma migrate`. Vercel build is `prisma generate && next build` (`vercel.json`).
- Prisma 7 needs the `PrismaPg` adapter: always construct via `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })` — see `src/lib/db.ts` (singleton via `globalThis`, required for serverless). A bare `new PrismaClient()` will not work.
- `DATABASE_URL` pooling: use the **pooled** Neon URL (`-pooler`, `?sslmode=require`) in Vercel/prod, the **direct** URL locally for `db push`.

## Auth (single admin, no providers)

- Cookie `fpl_admin` = `<expiresAt>.<hmac-sha256>` signed with `AUTH_SECRET` (`src/lib/auth.ts`, 30-day TTL).
- Every admin server action (`src/app/admin/**/actions.ts`) must call `await requireAdmin()` first (`src/components/admin/AdminShell.tsx`); admin pages are guarded by `AdminShell`, UploadThing uploads by the same `verifySession` check in `src/app/api/uploadthing/core.ts`.
- Login at `/login` with `ADMIN_PASSWORD`.

## Architecture

- `src/lib/domain/` — pure, tested business logic: `standings.ts` (any matchday with loaded points counts, regardless of `played`; sort total desc, name asc), `cuts.ts` (cut tiebreak = general-standings rank via `resolveCutWinner`), `simulator.ts` (estimates for matchdays that already have real points are ignored), `types.ts`. Put new rules here with a `.test.ts`, not in pages/actions.
- `src/lib/data.ts` — cached (`cache()` from React) read layer composing domain functions; pages call these.
- `src/app/admin/` — server-action CRUD per section (`equipos`, `jornadas`, `cortes`, `noticias`, `simulador`) + `revalidatePath` after writes; pages outside `src/app/admin/` and `src/app/login/` are read-only.
- `NEXT_PUBLIC_SITE_URL` feeds absolute OG/Twitter preview URLs; news images go through UploadThing (`newsImage` router, 8MB, images only).

## Env (all 5 required)

`DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET` (`openssl rand -hex 32`), `UPLOADTHING_TOKEN`, `NEXT_PUBLIC_SITE_URL`.
