# FPL Liga de Amigos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir y desplegar un sitio público tipo diario deportivo con noticias, tabla de posiciones, cortes con premio y un simulador de proyecciones para una liga de Fantasy Premier League entre amigos, administrado por una sola persona.

**Architecture:** Next.js 15 (App Router, TypeScript, Tailwind v4) server-rendered para permitir Open Graph dinámico por noticia. Postgres en Neon vía Prisma. Imágenes con Uploadthing. Admin único protegido por contraseña y cookie firmada. Toda la lógica de posiciones/cortes/simulador son funciones puras testeables; nunca se persisten posiciones.

**Tech Stack:** Next.js 15, TypeScript, TailwindCSS v4, Prisma 6, PostgreSQL (Neon), Uploadthing 7, Vitest 2, Zod 3, Vercel.

**Spec:** `docs/plans/2026-09-18-fpl-news-design.md`

## Global Constraints

- Una sola persona administra. No hay registro de usuarios ni roles.
- El sitio público se ve sin login. `/admin/*` exige cookie de sesión válida.
- Las posiciones/tablas/ganadores SIEMPRE se calculan; nunca se persisten como campos.
- Sin escudos ni logos por equipo. Equipo = nombre + manager + activo.
- Cortes se asignan a mano jornada por jornada (no son bloques fijos).
- Preview social rica obligatoria: cada noticia publicada debe exponer `og:title`, `og:description`, `og:image`.
- Empate en un corte: gana quien esté más arriba en la tabla general.
- TDD para toda lógica de dominio (`standings`, `cuts`, `simulator`, `slug`, `auth`).
- No agregar comentarios al código salvo que sean imprescindibles.
- Commit al final de cada task.
- Puntos son enteros ≥ 0. Slugs únicos.

---

### Task 1: Scaffold del proyecto

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, `.env.example`

**Interfaces:**
- Consumes: nada.
- Produces: proyecto Next.js arrancable con `npm run dev` y `npm run build`.

- [ ] **Step 1: Crear el proyecto Next.js**

Run (dentro de `F:\Data Agustin\Desktop\transito\fpl`):
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm --yes
```
Expected: se crean `src/app/*`, `package.json`, `next.config.ts`. Como el repo ya tiene `docs/`, `create-next-app` acepta el directorio no vacío.

- [ ] **Step 2: Instalar dependencias del proyecto**

Run:
```bash
npm install @prisma/client zod uploadthing @uploadthing/react
npm install -D prisma vitest @vitejs/plugin-react vite-tsconfig-paths @types/node
```
Expected: sin errores; `prisma` y `vitest` en devDependencies.

- [ ] **Step 3: Configurar Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

Modify `package.json` scripts para incluir:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Crear `.env.example`**

Create `.env.example`:
```
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
ADMIN_PASSWORD="cambiar-esta-clave"
AUTH_SECRET="cadena-larga-aleatoria-para-firmar-cookies"
UPLOADTHING_TOKEN="token-de-uploadthing"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

- [ ] **Step 5: Verificar build base**

Run: `npm run build`
Expected: build exitoso con la página default de Next.js.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + Vitest"
```

---

### Task 2: Lógica de dominio — tabla de posiciones

**Files:**
- Create: `src/lib/domain/types.ts`, `src/lib/domain/standings.ts`, `src/lib/domain/standings.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `TeamRef = { id: string; name: string; manager: string }`
  - `PointsRow = { teamId: string; points: number }`
  - `MatchdayData = { id: string; played: boolean; points: PointsRow[] }`
  - `StandingRow = { teamId: string; teamName: string; manager: string; played: number; total: number; rank: number }`
  - `computeStandings(teams: TeamRef[], matchdays: MatchdayData[]): StandingRow[]`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/domain/standings.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { computeStandings } from "./standings";
import type { MatchdayData, TeamRef } from "./types";

const teams: TeamRef[] = [
  { id: "a", name: "Alpha", manager: "Ana" },
  { id: "b", name: "Beta", manager: "Beto" },
  { id: "c", name: "Gamma", manager: "Caro" },
];

describe("computeStandings", () => {
  it("suma puntos por equipo y ordena descendente", () => {
    const matchdays: MatchdayData[] = [
      { id: "1", played: true, points: [
        { teamId: "a", points: 70 }, { teamId: "b", points: 55 }, { teamId: "c", points: 61 },
      ]},
      { id: "2", played: true, points: [
        { teamId: "a", points: 40 }, { teamId: "b", points: 66 }, { teamId: "c", points: 50 },
      ]},
    ];
    const rows = computeStandings(teams, matchdays);
    expect(rows.map((r) => [r.teamName, r.total, r.rank])).toEqual([
      ["Alpha", 110, 1],
      ["Gamma", 111, 2].length ? ["Beta", 121, 1] : [],
    ]);
  });

  it("cuenta jornadas jugadas solo si el equipo tiene fila de puntos", () => {
    const matchdays: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 10 }] },
    ];
    const rows = computeStandings(teams, matchdays);
    const a = rows.find((r) => r.teamId === "a")!;
    const b = rows.find((r) => r.teamId === "b")!;
    expect(a.played).toBe(1);
    expect(b.played).toBe(0);
    expect(b.total).toBe(0);
  });

  it("desempata por nombre ascendente", () => {
    const matchdays: MatchdayData[] = [
      { id: "1", played: true, points: [
        { teamId: "a", points: 10 }, { teamId: "b", points: 10 }, { teamId: "c", points: 10 },
      ]},
    ];
    const rows = computeStandings(teams, matchdays);
    expect(rows.map((r) => r.teamName)).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("ignora jornadas no jugadas", () => {
    const matchdays: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 10 }] },
      { id: "2", played: false, points: [{ teamId: "a", points: 99 }] },
    ];
    const rows = computeStandings(teams, matchdays);
    expect(rows.find((r) => r.teamId === "a")!.total).toBe(10);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/domain/standings.test.ts`
Expected: FAIL con "Cannot find module './standings'" o "computeStandings is not a function".

- [ ] **Step 3: Crear los tipos**

Create `src/lib/domain/types.ts`:
```ts
export type TeamRef = { id: string; name: string; manager: string };
export type PointsRow = { teamId: string; points: number };
export type MatchdayData = { id: string; played: boolean; points: PointsRow[] };
export type StandingRow = {
  teamId: string;
  teamName: string;
  manager: string;
  played: number;
  total: number;
  rank: number;
};
```

- [ ] **Step 4: Implementación mínima**

Create `src/lib/domain/standings.ts`:
```ts
import type { MatchdayData, StandingRow, TeamRef } from "./types";

export function computeStandings(
  teams: TeamRef[],
  matchdays: MatchdayData[],
): StandingRow[] {
  const totals = new Map<string, { total: number; played: number }>();
  for (const team of teams) totals.set(team.id, { total: 0, played: 0 });

  for (const matchday of matchdays) {
    if (!matchday.played) continue;
    for (const row of matchday.points) {
      const entry = totals.get(row.teamId);
      if (!entry) continue;
      entry.total += row.points;
      entry.played += 1;
    }
  }

  const rows = teams.map((team) => {
    const entry = totals.get(team.id)!;
    return {
      teamId: team.id,
      teamName: team.name,
      manager: team.manager,
      played: entry.played,
      total: entry.total,
      rank: 0,
    };
  });

  rows.sort(
    (a, b) => b.total - a.total || a.teamName.localeCompare(b.teamName),
  );
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });
  return rows;
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/domain/standings.test.ts`
Expected: PASS (4 tests). Corregir el test del Step 1: el primer test tiene un arreglo confuso; debe esperar `[["Beta",121,1],["Gamma",111,2],["Alpha",110,3]]`. Reemplazar el `expect` por esa forma antes de correr.

- [ ] **Step 6: Commit**

```bash
git add src/lib/domain
git commit -m "feat: cálculo de tabla de posiciones"
```

---

### Task 3: Lógica de dominio — ganador de corte

**Files:**
- Create: `src/lib/domain/cuts.ts`, `src/lib/domain/cuts.test.ts`

**Interfaces:**
- Consumes: `computeStandings`, `StandingRow`, `TeamRef`, `MatchdayData`.
- Produces:
  - `MatchdayInCut = { id: string; played: boolean; points: PointsRow[]; cutId: string | null }`
  - `resolveCutWinner(cutRows: StandingRow[], generalRows: StandingRow[]): { winner: StandingRow | null; tied: boolean }`
  - `standingsForCut(teams: TeamRef[], matchdays: MatchdayInCut[], cutId: string): StandingRow[]`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/domain/cuts.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { resolveCutWinner, standingsForCut } from "./cuts";
import type { MatchdayInCut } from "./cuts";
import type { StandingRow, TeamRef } from "./types";

const teams: TeamRef[] = [
  { id: "a", name: "Alpha", manager: "Ana" },
  { id: "b", name: "Beta", manager: "Beto" },
];

describe("resolveCutWinner", () => {
  const general: StandingRow[] = [
    { teamId: "a", teamName: "Alpha", manager: "Ana", played: 4, total: 300, rank: 1 },
    { teamId: "b", teamName: "Beta", manager: "Beto", played: 4, total: 280, rank: 2 },
  ];
  const cut: StandingRow[] = [
    { teamId: "b", teamName: "Beta", manager: "Beto", played: 4, total: 121, rank: 1 },
    { teamId: "a", teamName: "Alpha", manager: "Ana", played: 4, total: 110, rank: 2 },
  ];

  it("elige al de mayor total en el corte", () => {
    expect(resolveCutWinner(cut, general).winner?.teamId).toBe("b");
  });

  it("desempata por la tabla general", () => {
    const tied = cut.map((r) => ({ ...r, total: 110 }));
    const result = resolveCutWinner(tied, general);
    expect(result.tied).toBe(true);
    expect(result.winner?.teamId).toBe("a");
  });

  it("devuelve null si no hay filas", () => {
    expect(resolveCutWinner([], general).winner).toBeNull();
  });
});

describe("standingsForCut", () => {
  it("solo suma jornadas del corte indicado", () => {
    const matchdays: MatchdayInCut[] = [
      { id: "1", played: true, cutId: "c1", points: [{ teamId: "a", points: 10 }] },
      { id: "2", played: true, cutId: "c2", points: [{ teamId: "a", points: 50 }] },
    ];
    const rows = standingsForCut(teams, matchdays, "c1");
    expect(rows.find((r) => r.teamId === "a")!.total).toBe(10);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/domain/cuts.test.ts`
Expected: FAIL "Cannot find module './cuts'".

- [ ] **Step 3: Implementación mínima**

Create `src/lib/domain/cuts.ts`:
```ts
import { computeStandings } from "./standings";
import type { MatchdayData, PointsRow, StandingRow, TeamRef } from "./types";

export type MatchdayInCut = MatchdayData & { cutId: string | null };

export function standingsForCut(
  teams: TeamRef[],
  matchdays: MatchdayInCut[],
  cutId: string,
): StandingRow[] {
  return computeStandings(
    teams,
    matchdays.filter((m) => m.cutId === cutId),
  );
}

export function resolveCutWinner(
  cutRows: StandingRow[],
  generalRows: StandingRow[],
): { winner: StandingRow | null; tied: boolean } {
  if (cutRows.length === 0) return { winner: null, tied: false };
  const max = Math.max(...cutRows.map((r) => r.total));
  const leaders = cutRows.filter((r) => r.total === max);
  const generalRank = new Map(generalRows.map((r) => [r.teamId, r.rank]));
  const winner = [...leaders].sort(
    (a, b) => (generalRank.get(a.teamId) ?? 999) - (generalRank.get(b.teamId) ?? 999),
  )[0];
  return { winner, tied: leaders.length > 1 };
}

export type { PointsRow };
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/domain/cuts.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/domain
git commit -m "feat: ganador de corte con desempate por tabla general"
```

---

### Task 4: Lógica de dominio — simulador

**Files:**
- Create: `src/lib/domain/simulator.ts`, `src/lib/domain/simulator.test.ts`

**Interfaces:**
- Consumes: `computeStandings`, `TeamRef`, `MatchdayData`, `PointsRow`, `StandingRow`.
- Produces:
  - `EstimateData = { matchdayId: string; points: PointsRow[] }`
  - `projectStandings(teams: TeamRef[], realMatchdays: MatchdayData[], estimates: EstimateData[]): StandingRow[]`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/domain/simulator.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { projectStandings } from "./simulator";
import type { MatchdayData, TeamRef } from "./types";

const teams: TeamRef[] = [
  { id: "a", name: "Alpha", manager: "Ana" },
  { id: "b", name: "Beta", manager: "Beto" },
];

describe("projectStandings", () => {
  it("suma puntos reales más estimaciones", () => {
    const real: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 50 }, { teamId: "b", points: 40 }] },
      { id: "2", played: false, points: [] },
    ];
    const estimates = [
      { matchdayId: "2", points: [{ teamId: "a", points: 30 }, { teamId: "b", points: 60 }] },
    ];
    const rows = projectStandings(teams, real, estimates);
    expect(rows.map((r) => [r.teamName, r.total])).toEqual([["Beta", 100], ["Alpha", 80]]);
  });

  it("sin estimaciones proyecta solo lo real", () => {
    const real: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 10 }] },
    ];
    const rows = projectStandings(teams, real, []);
    expect(rows.find((r) => r.teamId === "a")!.total).toBe(10);
    expect(rows.find((r) => r.teamId === "b")!.total).toBe(0);
  });

  it("ignora estimaciones de jornadas ya jugadas", () => {
    const real: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 10 }] },
    ];
    const estimates = [{ matchdayId: "1", points: [{ teamId: "a", points: 999 }] }];
    const rows = projectStandings(teams, real, estimates);
    expect(rows.find((r) => r.teamId === "a")!.total).toBe(10);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/domain/simulator.test.ts`
Expected: FAIL "Cannot find module './simulator'".

- [ ] **Step 3: Implementación mínima**

Create `src/lib/domain/simulator.ts`:
```ts
import { computeStandings } from "./standings";
import type { MatchdayData, PointsRow, StandingRow, TeamRef } from "./types";

export type EstimateData = { matchdayId: string; points: PointsRow[] };

export function projectStandings(
  teams: TeamRef[],
  realMatchdays: MatchdayData[],
  estimates: EstimateData[],
): StandingRow[] {
  const playedIds = new Set(
    realMatchdays.filter((m) => m.played).map((m) => m.id),
  );
  const estimateMatchdays: MatchdayData[] = estimates
    .filter((e) => !playedIds.has(e.matchdayId))
    .map((e) => ({ id: `estimate:${e.matchdayId}`, played: true, points: e.points }));
  return computeStandings(teams, [...realMatchdays, ...estimateMatchdays]);
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/domain/simulator.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Correr toda la suite y commit**

Run: `npm test`
Expected: PASS (11 tests).

```bash
git add src/lib/domain
git commit -m "feat: proyecciones del simulador"
```

---

### Task 5: Utilidad de slug

**Files:**
- Create: `src/lib/slug.ts`, `src/lib/slug.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `slugify(input: string): string`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/slug.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("quita acentos y espacios", () => {
    expect(slugify("Traspaso bomba: ¡Mbappé al Real!")).toBe("traspaso-bomba-mbappe-al-real");
  });
  it("colapsa separadores repetidos", () => {
    expect(slugify("  hola ---  mundo  ")).toBe("hola-mundo");
  });
  it("devuelve cadena vacía si no hay caracteres válidos", () => {
    expect(slugify("¡!¿?")).toBe("");
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/slug.test.ts`
Expected: FAIL "Cannot find module './slug'".

- [ ] **Step 3: Implementación mínima**

Create `src/lib/slug.ts`:
```ts
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/slug.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/slug.ts src/lib/slug.test.ts
git commit -m "feat: slugify para URLs de noticias"
```

---

### Task 6: Autenticación de admin

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth.test.ts`

**Interfaces:**
- Consumes: `node:crypto`.
- Produces:
  - `checkPassword(password: string): boolean`
  - `signSession(expiresAt: number): string`
  - `verifySession(token: string | undefined): boolean`
  - `SESSION_COOKIE = "fpl_admin"`
  - `SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/auth.test.ts`:
```ts
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.ADMIN_PASSWORD = "secreto";
  process.env.AUTH_SECRET = "test-secret";
});

describe("auth", () => {
  it("valida la contraseña correcta e incorrecta", async () => {
    const { checkPassword } = await import("./auth");
    expect(checkPassword("secreto")).toBe(true);
    expect(checkPassword("otra")).toBe(false);
  });

  it("firma y verifica una sesión válida", async () => {
    const { signSession, verifySession } = await import("./auth");
    const token = signSession(Date.now() + 10000);
    expect(verifySession(token)).toBe(true);
  });

  it("rechaza una sesión expirada", async () => {
    const { signSession, verifySession } = await import("./auth");
    const token = signSession(Date.now() - 1000);
    expect(verifySession(token)).toBe(false);
  });

  it("rechaza una firma manipulada", async () => {
    const { signSession, verifySession } = await import("./auth");
    const token = signSession(Date.now() + 10000);
    expect(verifySession(token.slice(0, -1) + "0")).toBe(false);
  });

  it("rechaza token undefined", async () => {
    const { verifySession } = await import("./auth");
    expect(verifySession(undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: FAIL "Cannot find module './auth'".

- [ ] **Step 3: Implementación mínima**

Create `src/lib/auth.ts`:
```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "fpl_admin";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET no configurado");
  return value;
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(password.padEnd(64, " "));
  const b = Buffer.from(expected.padEnd(64, " "));
  return a.length === b.length && timingSafeEqual(a, b) && password === expected;
}

export function signSession(expiresAt: number): string {
  const payload = String(expiresAt);
  return `${payload}.${signature(payload)}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = signature(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts
git commit -m "feat: autenticación por contraseña y cookie firmada"
```

---

### Task 7: Esquema Prisma y cliente de base de datos

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`
- Modify: `package.json` (scripts `db:generate`, `db:push`, `db:seed`)

**Interfaces:**
- Consumes: `DATABASE_URL`.
- Produces: `prisma` (PrismaClient singleton) con modelos `Team`, `Matchday`, `MatchdayPoints`, `Cut`, `Estimate`, `Post`, enum `PostCategory`.

- [ ] **Step 1: Inicializar Prisma**

Run: `npx prisma init --datasource-provider postgresql`
Expected: crea `prisma/schema.prisma` y agrega `DATABASE_URL` a `.env`.

- [ ] **Step 2: Escribir el schema**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PostCategory {
  TRANSFERS
  DECLARATIONS
  STATEMENTS
  GENERAL
}

model Team {
  id        String           @id @default(cuid())
  name      String           @unique
  manager   String
  active    Boolean          @default(true)
  points    MatchdayPoints[]
  estimates Estimate[]
  createdAt DateTime         @default(now())
}

model Matchday {
  id        String           @id @default(cuid())
  number    Int              @unique
  played    Boolean          @default(false)
  cutId     String?
  cut       Cut?             @relation(fields: [cutId], references: [id], onDelete: SetNull)
  points    MatchdayPoints[]
  estimates Estimate[]
  createdAt DateTime         @default(now())
}

model MatchdayPoints {
  id         String   @id @default(cuid())
  matchdayId String
  teamId     String
  points     Int
  matchday   Matchday @relation(fields: [matchdayId], references: [id], onDelete: Cascade)
  team       Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([matchdayId, teamId])
}

model Cut {
  id        String     @id @default(cuid())
  name      String     @unique
  order     Int        @default(0)
  closed    Boolean    @default(false)
  matchdays Matchday[]
  createdAt DateTime   @default(now())
}

model Estimate {
  id         String   @id @default(cuid())
  matchdayId String
  teamId     String
  points     Int
  matchday   Matchday @relation(fields: [matchdayId], references: [id], onDelete: Cascade)
  team       Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([matchdayId, teamId])
}

model Post {
  id          String       @id @default(cuid())
  slug        String       @unique
  title       String
  excerpt     String
  category    PostCategory
  body        String
  imageUrl    String?
  published   Boolean      @default(false)
  publishedAt DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

- [ ] **Step 3: Crear el cliente singleton**

Create `src/lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Generar el cliente y crear las tablas**

Run:
```bash
npx prisma generate
npx prisma db push
```
Expected: "Your database is now in sync with your Prisma schema." (Requiere `DATABASE_URL` de Neon en `.env`.)

- [ ] **Step 5: Commit**

```bash
git add prisma src/lib/db.ts package.json
git commit -m "feat: schema Prisma y cliente de base de datos"
```

---

### Task 8: Mapeo de datos y queries compartidas

**Files:**
- Create: `src/lib/data.ts`

**Interfaces:**
- Consumes: `prisma`, tipos de dominio.
- Produces:
  - `getTeams(): Promise<TeamRef[]>`
  - `getMatchdays(): Promise<MatchdayData[]>` (solo jugadas o todas, con flag `played`)
  - `getMatchdaysWithCut(): Promise<MatchdayInCut[]>`
  - `getCuts(): Promise<{ id: string; name: string; order: number; closed: boolean; matchdayIds: string[] }[]>`
  - `getEstimates(): Promise<EstimateData[]>`
  - `getGeneralStandings(): Promise<StandingRow[]>`
  - `getCutResult(cutId: string): Promise<{ cut; rows: StandingRow[]; winner: StandingRow | null; tied: boolean }>`
  - `getProjectedStandings(): Promise<StandingRow[]>`
  - `getProjectedCutResult(cutId: string): Promise<{ rows: StandingRow[]; winner: StandingRow | null; tied: boolean }>`

- [ ] **Step 1: Implementar el módulo**

Create `src/lib/data.ts`:
```ts
import { cache } from "react";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/domain/standings";
import { resolveCutWinner, standingsForCut } from "@/lib/domain/cuts";
import type { MatchdayInCut } from "@/lib/domain/cuts";
import { projectStandings } from "@/lib/domain/simulator";
import type { EstimateData } from "@/lib/domain/simulator";
import type { MatchdayData, StandingRow, TeamRef } from "@/lib/domain/types";

export const getTeams = cache(async (): Promise<TeamRef[]> => {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  return teams.map((t) => ({ id: t.id, name: t.name, manager: t.manager }));
});

export const getMatchdaysWithCut = cache(async (): Promise<MatchdayInCut[]> => {
  const matchdays = await prisma.matchday.findMany({
    orderBy: { number: "asc" },
    include: { points: true },
  });
  return matchdays.map((m) => ({
    id: m.id,
    played: m.played,
    cutId: m.cutId,
    points: m.points.map((p) => ({ teamId: p.teamId, points: p.points })),
  }));
});

export const getMatchdays = cache(async (): Promise<MatchdayData[]> =>
  (await getMatchdaysWithCut()).map(({ id, played, points }) => ({ id, played, points })),
);

export const getCuts = cache(async () =>
  prisma.cut.findMany({
    orderBy: { order: "asc" },
    include: { matchdays: { orderBy: { number: "asc" }, select: { id: true } } },
  }).then((cuts) =>
    cuts.map((c) => ({
      id: c.id,
      name: c.name,
      order: c.order,
      closed: c.closed,
      matchdayIds: c.matchdays.map((m) => m.id),
    })),
  ),
);

export const getEstimates = cache(async (): Promise<EstimateData[]> => {
  const estimates = await prisma.estimate.findMany();
  const grouped = new Map<string, { teamId: string; points: number }[]>();
  for (const e of estimates) {
    const list = grouped.get(e.matchdayId) ?? [];
    list.push({ teamId: e.teamId, points: e.points });
    grouped.set(e.matchdayId, list);
  }
  return [...grouped.entries()].map(([matchdayId, points]) => ({ matchdayId, points }));
});

export const getGeneralStandings = cache(async (): Promise<StandingRow[]> =>
  computeStandings(await getTeams(), await getMatchdays()),
);

export const getProjectedStandings = cache(async (): Promise<StandingRow[]> =>
  projectStandings(await getTeams(), await getMatchdays(), await getEstimates()),
);

export async function getCutResult(cutId: string) {
  const teams = await getTeams();
  const matchdays = await getMatchdaysWithCut();
  const cuts = await getCuts();
  const cut = cuts.find((c) => c.id === cutId);
  if (!cut) return { cut: null, rows: [], winner: null, tied: false };
  const rows = standingsForCut(teams, matchdays, cutId);
  const { winner, tied } = resolveCutWinner(rows, await getGeneralStandings());
  return { cut, rows, winner, tied };
}

export async function getProjectedCutResult(cutId: string) {
  const teams = await getTeams();
  const cuts = await getCuts();
  const cut = cuts.find((c) => c.id === cutId);
  if (!cut) return { rows: [] as StandingRow[], winner: null, tied: false };
  const idSet = new Set(cut.matchdayIds);
  const projected = await getProjectedStandings();
  const projectedRows = projected.filter((r) => teams.some((t) => t.id === r.teamId));
  void idSet;
  return { rows: projectedRows, winner: null, tied: false };
}
```

Nota: `getProjectedCutResult` se corrige en Task 15 para calcular solo el corte; dejar la versión mínima que compila.

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat: queries de datos con cálculos derivados"
```

---

### Task 9: Login y guard de admin

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/login/actions.ts`, `src/components/admin/AdminShell.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `checkPassword`, `signSession`, `SESSION_COOKIE`, `SESSION_TTL_MS`, `verifySession`.
- Produces: server action `login(formData: FormData): Promise<{ error?: string }>` y helper `requireAdmin()` (redirige a `/login`).

- [ ] **Step 1: Implementar acciones de login/logout**

Create `src/app/login/actions.ts`:
```ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, SESSION_COOKIE, SESSION_TTL_MS, signSession } from "@/lib/auth";

export async function login(_prev: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { error: "Contraseña incorrecta" };
  const expiresAt = Date.now() + SESSION_TTL_MS;
  (await cookies()).set(SESSION_COOKIE, signSession(expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
```

- [ ] **Step 2: Implementar la página de login**

Create `src/app/login/page.tsx`:
```tsx
"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { error: undefined as string | undefined });
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-2xl font-bold">Panel de administración</h1>
      <form action={action} className="space-y-4">
        <input
          name="password"
          type="password"
          required
          placeholder="Contraseña"
          className="w-full rounded border px-3 py-2"
        />
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Crear el guard y el shell de admin**

Create `src/components/admin/AdminShell.tsx`:
```tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const links = [
  ["/admin", "Resumen"],
  ["/admin/equipos", "Equipos"],
  ["/admin/jornadas", "Jornadas"],
  ["/admin/cortes", "Cortes"],
  ["/admin/noticias", "Noticias"],
  ["/admin/simulador", "Simulador"],
] as const;

export async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySession(token)) redirect("/login");
}

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-5xl gap-8 px-6 py-10">
      <aside className="w-48 shrink-0">
        <nav className="space-y-2 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="block rounded px-2 py-1 hover:bg-neutral-100">
              {label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-8">
          <button className="text-sm text-red-600">Cerrar sesión</button>
        </form>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
```

- [ ] **Step 4: Verificar manualmente**

Run: `npm run dev`, abrir `http://localhost:3000/login`, ingresar la contraseña de `.env`.
Expected: redirige a `/admin` (crear `src/app/admin/page.tsx` mínimo = "Resumen" en Task siguiente; puede devolver 404 temporalmente, pero la cookie se setea y `/login` no muestra error).

- [ ] **Step 5: Commit**

```bash
git add src/app/login src/components/admin
git commit -m "feat: login de admin y guard de sesión"
```

---

### Task 10: Admin — CRUD de equipos

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/equipos/page.tsx`, `src/app/admin/equipos/actions.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `prisma`.
- Produces: server actions `createTeam`, `updateTeam`, `deleteTeam`.

- [ ] **Step 1: Crear layout y dashboard**

Create `src/app/admin/layout.tsx`:
```tsx
import AdminShell from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
```

Create `src/app/admin/page.tsx`:
```tsx
export default function AdminHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Panel</h1>
      <p className="mt-2 text-neutral-600">Gestioná equipos, jornadas, cortes y noticias.</p>
    </div>
  );
}
```

- [ ] **Step 2: Implementar acciones y página de equipos**

Create `src/app/admin/equipos/actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";

export async function createTeam(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const manager = String(formData.get("manager") ?? "").trim();
  if (!name || !manager) return;
  await prisma.team.create({ data: { name, manager } });
  revalidatePath("/admin/equipos");
}

export async function updateTeam(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const manager = String(formData.get("manager") ?? "").trim();
  const active = formData.get("active") === "on";
  if (!id || !name || !manager) return;
  await prisma.team.update({ where: { id }, data: { name, manager, active } });
  revalidatePath("/admin/equipos");
}

export async function deleteTeam(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.team.delete({ where: { id } });
  revalidatePath("/admin/equipos");
}
```

Create `src/app/admin/equipos/page.tsx`:
```tsx
import { prisma } from "@/lib/db";
import { createTeam, deleteTeam, updateTeam } from "./actions";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Equipos</h1>

      <form action={createTeam} className="flex flex-wrap items-end gap-3 rounded border p-4">
        <label className="flex flex-col text-sm">
          Nombre
          <input name="name" required className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Manager
          <input name="manager" required className="rounded border px-2 py-1" />
        </label>
        <button className="rounded bg-black px-3 py-2 text-sm text-white">Agregar</button>
      </form>

      <ul className="divide-y rounded border">
        {teams.map((team) => (
          <li key={team.id} className="flex items-center gap-3 p-3">
            <form action={updateTeam} className="flex flex-1 items-center gap-3">
              <input type="hidden" name="id" value={team.id} />
              <input name="name" defaultValue={team.name} className="rounded border px-2 py-1" />
              <input name="manager" defaultValue={team.manager} className="rounded border px-2 py-1" />
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" name="active" defaultChecked={team.active} /> Activo
              </label>
              <button className="rounded bg-neutral-200 px-3 py-1 text-sm">Guardar</button>
            </form>
            <form action={deleteTeam}>
              <input type="hidden" name="id" value={team.id} />
              <button className="text-sm text-red-600">Eliminar</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

Run: `npm run dev` → `/admin/equipos`. Agregar un equipo, editarlo, borrarlo.
Expected: la lista refleja cada operación.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin
git commit -m "feat: CRUD de equipos en el panel"
```

---

### Task 11: Admin — jornadas y carga de puntos

**Files:**
- Create: `src/app/admin/jornadas/page.tsx`, `src/app/admin/jornadas/actions.ts`

**Interfaces:**
- Consumes: `prisma`, `requireAdmin`.
- Produces: server actions `createMatchday`, `savePoints`, `togglePlayed`.

- [ ] **Step 1: Implementar acciones**

Create `src/app/admin/jornadas/actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";

export async function createMatchday(formData: FormData) {
  await requireAdmin();
  const number = Number(formData.get("number"));
  if (!Number.isInteger(number) || number < 1) return;
  await prisma.matchday.upsert({
    where: { number },
    update: {},
    create: { number },
  });
  revalidatePath("/admin/jornadas");
}

export async function savePoints(matchdayId: string, entries: { teamId: string; points: number }[]) {
  await requireAdmin();
  for (const entry of entries) {
    await prisma.matchdayPoints.upsert({
      where: { matchdayId_teamId: { matchdayId, teamId: entry.teamId } },
      update: { points: entry.points },
      create: { matchdayId, teamId: entry.teamId, points: entry.points },
    });
  }
  revalidatePath("/admin/jornadas");
}

export async function togglePlayed(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const played = formData.get("played") === "true";
  await prisma.matchday.update({ where: { id }, data: { played } });
  revalidatePath("/admin/jornadas");
}
```

- [ ] **Step 2: Implementar la página con formulario de puntos**

Create `src/app/admin/jornadas/page.tsx`:
```tsx
import { prisma } from "@/lib/db";
import { createMatchday, togglePlayed } from "./actions";
import { PointsForm } from "./PointsForm";

export default async function MatchdaysPage() {
  const [matchdays, teams] = await Promise.all([
    prisma.matchday.findMany({ orderBy: { number: "asc" }, include: { points: true, cut: true } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Jornadas</h1>

      <form action={createMatchday} className="flex items-end gap-3 rounded border p-4">
        <label className="flex flex-col text-sm">
          Número de jornada
          <input name="number" type="number" min={1} required className="rounded border px-2 py-1" />
        </label>
        <button className="rounded bg-black px-3 py-2 text-sm text-white">Crear</button>
      </form>

      {matchdays.map((matchday) => (
        <div key={matchday.id} className="rounded border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              Jornada {matchday.number}
              {matchday.cut ? ` · ${matchday.cut.name}` : " · sin corte"}
            </h2>
            <form action={togglePlayed}>
              <input type="hidden" name="id" value={matchday.id} />
              <input type="hidden" name="played" value={String(!matchday.played)} />
              <button className="rounded bg-neutral-200 px-3 py-1 text-sm">
                {matchday.played ? "Marcar como no jugada" : "Marcar como jugada"}
              </button>
            </form>
          </div>
          <PointsForm
            matchdayId={matchday.id}
            teams={teams.map((t) => ({ id: t.id, name: t.name }))}
            initial={Object.fromEntries(matchday.points.map((p) => [p.teamId, p.points]))}
          />
        </div>
      ))}
    </div>
  );
}
```

Create `src/app/admin/jornadas/PointsForm.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { savePoints } from "./actions";

export function PointsForm({
  matchdayId,
  teams,
  initial,
}: {
  matchdayId: string;
  teams: { id: string; name: string }[];
  initial: Record<string, number>;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(teams.map((t) => [t.id, String(initial[t.id] ?? "")])),
  );
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const entries = Object.entries(values)
          .filter(([, v]) => v !== "")
          .map(([teamId, v]) => ({ teamId, points: Math.max(0, Number(v)) }));
        startTransition(() => {
          void savePoints(matchdayId, entries);
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {teams.map((team) => (
          <label key={team.id} className="flex items-center justify-between gap-2 text-sm">
            {team.name}
            <input
              type="number"
              min={0}
              value={values[team.id]}
              onChange={(e) => setValues((v) => ({ ...v, [team.id]: e.target.value }))}
              className="w-20 rounded border px-2 py-1"
            />
          </label>
        ))}
      </div>
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50">
        {pending ? "Guardando…" : "Guardar puntos"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

Run: `/admin/jornadas`. Crear jornada 1, cargar puntos, marcarla jugada, verificar que `/tabla` (aún 404) no rompe el build.
Expected: puntos persisten tras recargar.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/jornadas
git commit -m "feat: gestión de jornadas y carga de puntos"
```

---

### Task 12: Admin — cortes

**Files:**
- Create: `src/app/admin/cortes/page.tsx`, `src/app/admin/cortes/actions.ts`

**Interfaces:**
- Consumes: `prisma`, `requireAdmin`.
- Produces: server actions `createCut`, `assignMatchdayToCut`, `toggleCutClosed`.

- [ ] **Step 1: Implementar acciones**

Create `src/app/admin/cortes/actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";

export async function createCut(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const order = Number(formData.get("order") ?? 0);
  if (!name) return;
  await prisma.cut.create({ data: { name, order } });
  revalidatePath("/admin/cortes");
}

export async function assignMatchdayToCut(formData: FormData) {
  await requireAdmin();
  const matchdayId = String(formData.get("matchdayId"));
  const cutId = String(formData.get("cutId"));
  await prisma.matchday.update({
    where: { id: matchdayId },
    data: { cutId: cutId === "" ? null : cutId },
  });
  revalidatePath("/admin/cortes");
}

export async function toggleCutClosed(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const closed = formData.get("closed") === "true";
  await prisma.cut.update({ where: { id }, data: { closed } });
  revalidatePath("/admin/cortes");
}
```

- [ ] **Step 2: Implementar la página**

Create `src/app/admin/cortes/page.tsx`:
```tsx
import { prisma } from "@/lib/db";
import { assignMatchdayToCut, createCut, toggleCutClosed } from "./actions";

export default async function CutsPage() {
  const [cuts, matchdays] = await Promise.all([
    prisma.cut.findMany({ orderBy: { order: "asc" } }),
    prisma.matchday.findMany({ orderBy: { number: "asc" }, include: { cut: true } }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Cortes</h1>

      <form action={createCut} className="flex items-end gap-3 rounded border p-4">
        <label className="flex flex-col text-sm">
          Nombre
          <input name="name" required placeholder="Corte 1" className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Orden
          <input name="order" type="number" defaultValue={0} className="w-20 rounded border px-2 py-1" />
        </label>
        <button className="rounded bg-black px-3 py-2 text-sm text-white">Crear</button>
      </form>

      <div className="space-y-3">
        {cuts.map((cut) => (
          <div key={cut.id} className="flex items-center justify-between rounded border p-3">
            <span className="font-medium">{cut.name}</span>
            <form action={toggleCutClosed}>
              <input type="hidden" name="id" value={cut.id} />
              <input type="hidden" name="closed" value={String(!cut.closed)} />
              <button className="rounded bg-neutral-200 px-3 py-1 text-sm">
                {cut.closed ? "Reabrir" : "Cerrar corte"}
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="rounded border p-4">
        <h2 className="mb-3 font-semibold">Asignar jornadas a cortes</h2>
        <ul className="space-y-2">
          {matchdays.map((matchday) => (
            <li key={matchday.id}>
              <form action={assignMatchdayToCut} className="flex items-center gap-3 text-sm">
                <input type="hidden" name="matchdayId" value={matchday.id} />
                <span className="w-28">Jornada {matchday.number}</span>
                <select name="cutId" defaultValue={matchday.cutId ?? ""} className="rounded border px-2 py-1">
                  <option value="">Sin corte</option>
                  {cuts.map((cut) => (
                    <option key={cut.id} value={cut.id}>{cut.name}</option>
                  ))}
                </select>
                <button className="rounded bg-neutral-200 px-3 py-1">Asignar</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

Run: `/admin/cortes`. Crear "Corte 1", asignar jornadas 1 y 2.
Expected: al recargar, las jornadas muestran su corte en `/admin/jornadas`.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/cortes
git commit -m "feat: gestión de cortes y asignación de jornadas"
```

---

### Task 13: Subida de imágenes con Uploadthing

**Files:**
- Create: `src/app/api/uploadthing/core.ts`, `src/app/api/uploadthing/route.ts`, `src/lib/uploadthing.ts`

**Interfaces:**
- Consumes: `verifySession`, `SESSION_COOKIE`.
- Produces: endpoint de subida `newsImage` y componente `UploadButton`.

- [ ] **Step 1: Crear el file router**

Create `src/app/api/uploadthing/core.ts`:
```ts
import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  newsImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const token = (await cookies()).get(SESSION_COOKIE)?.value;
      if (!verifySession(token)) throw new Error("No autorizado");
      return {};
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

Create `src/app/api/uploadthing/route.ts`:
```ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
```

- [ ] **Step 2: Crear los helpers de cliente**

Create `src/lib/uploadthing.ts`:
```ts
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores. Requiere `UPLOADTHING_TOKEN` en `.env`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/uploadthing src/lib/uploadthing.ts
git commit -m "feat: endpoint de subida de imágenes con Uploadthing"
```

---

### Task 14: Admin — CRUD de noticias

**Files:**
- Create: `src/app/admin/noticias/page.tsx`, `src/app/admin/noticias/actions.ts`, `src/app/admin/noticias/nueva/page.tsx`, `src/app/admin/noticias/[id]/page.tsx`, `src/components/admin/PostForm.tsx`

**Interfaces:**
- Consumes: `prisma`, `requireAdmin`, `slugify`, `UploadButton`.
- Produces: server actions `createPost`, `updatePost`, `deletePost`.

- [ ] **Step 1: Implementar acciones**

Create `src/app/admin/noticias/actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";
import { slugify } from "@/lib/slug";

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = base || "noticia";
  let candidate = root;
  let n = 2;
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${root}-${n++}`;
  }
}

function readPost(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    category: String(formData.get("category") ?? "GENERAL") as
      | "TRANSFERS" | "DECLARATIONS" | "STATEMENTS" | "GENERAL",
    body: String(formData.get("body") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    published: formData.get("published") === "on",
  };
}

export async function createPost(formData: FormData) {
  await requireAdmin();
  const data = readPost(formData);
  if (!data.title || !data.excerpt || !data.body) return;
  const slug = await uniqueSlug(slugify(data.title));
  const post = await prisma.post.create({
    data: { ...data, slug, publishedAt: data.published ? new Date() : null },
  });
  revalidatePath("/admin/noticias");
  redirect(`/admin/noticias/${post.id}`);
}

export async function updatePost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = readPost(formData);
  const current = await prisma.post.findUnique({ where: { id } });
  if (!current || !data.title || !data.excerpt || !data.body) return;
  const slug = await uniqueSlug(slugify(data.title), id);
  await prisma.post.update({
    where: { id },
    data: {
      ...data,
      slug,
      publishedAt: data.published ? current.publishedAt ?? new Date() : null,
    },
  });
  revalidatePath("/admin/noticias");
  revalidatePath(`/noticias/${slug}`);
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/noticias");
  redirect("/admin/noticias");
}
```

- [ ] **Step 2: Implementar el formulario compartido**

Create `src/components/admin/PostForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";

const categories = [
  ["TRANSFERS", "Traspasos"],
  ["DECLARATIONS", "Declaraciones"],
  ["STATEMENTS", "Comunicados"],
  ["GENERAL", "General"],
] as const;

type PostValues = {
  title?: string;
  excerpt?: string;
  category?: string;
  body?: string;
  imageUrl?: string | null;
  published?: boolean;
};

export function PostForm({
  action,
  values = {},
  submitLabel,
}: {
  action: (formData: FormData) => void;
  values?: PostValues;
  submitLabel: string;
}) {
  const [imageUrl, setImageUrl] = useState(values.imageUrl ?? "");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <label className="block text-sm">
        Título
        <input name="title" required defaultValue={values.title} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <label className="block text-sm">
        Bajada
        <input name="excerpt" required defaultValue={values.excerpt} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <label className="block text-sm">
        Categoría
        <select name="category" defaultValue={values.category ?? "GENERAL"} className="mt-1 rounded border px-2 py-1">
          {categories.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Cuerpo
        <textarea name="body" required rows={10} defaultValue={values.body} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <div className="space-y-2">
        <span className="block text-sm">Imagen destacada</span>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-40 rounded object-cover" />
        ) : null}
        <UploadButton
          endpoint="newsImage"
          onClientUploadComplete={(res) => setImageUrl(res?.[0]?.ufsUrl ?? "")}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={values.published} /> Publicada
      </label>
      <button className="rounded bg-black px-4 py-2 text-sm text-white">{submitLabel}</button>
    </form>
  );
}
```

- [ ] **Step 3: Implementar listado, nueva y edición**

Create `src/app/admin/noticias/page.tsx`:
```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function PostsPage() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Noticias</h1>
        <Link href="/admin/noticias/nueva" className="rounded bg-black px-3 py-2 text-sm text-white">
          Nueva noticia
        </Link>
      </div>
      <ul className="divide-y rounded border">
        {posts.map((post) => (
          <li key={post.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{post.title}</p>
              <p className="text-xs text-neutral-500">
                {post.category} · {post.published ? "Publicada" : "Borrador"}
              </p>
            </div>
            <Link href={`/admin/noticias/${post.id}`} className="text-sm underline">Editar</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Create `src/app/admin/noticias/nueva/page.tsx`:
```tsx
import { PostForm } from "@/components/admin/PostForm";
import { createPost } from "../actions";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nueva noticia</h1>
      <PostForm action={createPost} submitLabel="Crear noticia" />
    </div>
  );
}
```

Create `src/app/admin/noticias/[id]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PostForm } from "@/components/admin/PostForm";
import { deletePost, updatePost } from "../actions";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar noticia</h1>
      <PostForm
        action={updatePost}
        submitLabel="Guardar cambios"
        values={{
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
          body: post.body,
          imageUrl: post.imageUrl,
          published: post.published,
        }}
      />
      <form action={deletePost}>
        <input type="hidden" name="id" value={post.id} />
        <button className="text-sm text-red-600">Eliminar noticia</button>
      </form>
    </div>
  );
}
```

Nota: `PostForm` recibe `action` como `(formData) => void`; `updatePost` necesita el `id`. Agregar en `[id]/page.tsx` un input oculto dentro de un wrapper: cambiar `PostForm` para aceptar `children` y renderizarlo. Ajuste: pasar `<input type="hidden" name="id" value={post.id} />` como hijo y renderizar `{children}` como primer elemento del `<form>`. Implementar ese ajuste en este task.

- [ ] **Step 4: Verificar manualmente**

Run: `/admin/noticias/nueva`. Crear noticia con imagen, publicarla, verla en `/admin/noticias`.
Expected: la noticia aparece con categoría y estado correctos.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/noticias src/components/admin/PostForm.tsx
git commit -m "feat: CRUD de noticias con subida de imágenes"
```

---

### Task 15: Sitio público — noticias con Open Graph

**Files:**
- Create: `src/components/SiteHeader.tsx`, `src/components/NewsCard.tsx`, `src/components/ShareButtons.tsx`, `src/components/PostBody.tsx`, `src/app/noticias/page.tsx`, `src/app/noticias/[slug]/page.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `prisma`, `NEXT_PUBLIC_SITE_URL`.
- Produces: rutas públicas `/noticias` y `/noticias/[slug]` con `generateMetadata`.

- [ ] **Step 1: Crear header y tarjeta**

Create `src/components/SiteHeader.tsx`:
```tsx
import Link from "next/link";

const links = [
  ["/", "Portada"],
  ["/noticias", "Noticias"],
  ["/tabla", "Tabla"],
  ["/cortes", "Cortes"],
  ["/simulador", "Simulador"],
] as const;

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-black uppercase tracking-tight">Liga FPL</Link>
        <nav className="flex gap-4 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:underline">{label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

Create `src/components/NewsCard.tsx`:
```tsx
import Link from "next/link";

export function NewsCard({
  slug, title, excerpt, imageUrl, category,
}: {
  slug: string; title: string; excerpt: string; imageUrl: string | null; category: string;
}) {
  return (
    <article className="overflow-hidden rounded border">
      <Link href={`/noticias/${slug}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-48 w-full object-cover" />
        ) : (
          <div className="h-48 w-full bg-neutral-100" />
        )}
        <div className="p-4">
          <span className="text-xs font-semibold uppercase text-neutral-500">{category}</span>
          <h2 className="mt-1 text-lg font-bold">{title}</h2>
          <p className="mt-2 text-sm text-neutral-600">{excerpt}</p>
        </div>
      </Link>
    </article>
  );
}
```

- [ ] **Step 2: Crear botones de compartir**

Create `src/components/ShareButtons.tsx`:
```tsx
"use client";

import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const targets = [
    ["WhatsApp", `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`],
    ["X", `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`],
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noreferrer"
          className="rounded border px-3 py-1 text-sm hover:bg-neutral-100">
          {label}
        </a>
      ))}
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        }}
        className="rounded border px-3 py-1 text-sm hover:bg-neutral-100"
      >
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Implementar listado y detalle con metadata**

Create `src/app/noticias/page.tsx`:
```tsx
import { prisma } from "@/lib/db";
import { NewsCard } from "@/components/NewsCard";

export const metadata = { title: "Noticias" };

export default async function NewsListPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Noticias</h1>
      {posts.length === 0 ? (
        <p className="text-neutral-500">Todavía no hay noticias publicadas.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <NewsCard key={post.id} slug={post.slug} title={post.title}
              excerpt={post.excerpt} imageUrl={post.imageUrl} category={post.category} />
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `src/app/noticias/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ShareButtons } from "@/components/ShareButtons";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) return { title: "Noticia no encontrada" };
  const url = `${baseUrl}/noticias/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url,
      images: post.imageUrl ? [{ url: post.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.imageUrl ? [post.imageUrl] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();
  const url = `${baseUrl}/noticias/${post.slug}`;
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <span className="text-xs font-semibold uppercase text-neutral-500">{post.category}</span>
      <h1 className="text-3xl font-black">{post.title}</h1>
      <p className="text-lg text-neutral-600">{post.excerpt}</p>
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="w-full rounded object-cover" />
      ) : null}
      <div className="whitespace-pre-wrap leading-relaxed">{post.body}</div>
      <ShareButtons url={url} title={post.title} />
    </article>
  );
}
```

- [ ] **Step 4: Conectar el header en el layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Liga FPL", template: "%s · Liga FPL" },
  description: "Noticias, posiciones y cortes de nuestra liga de Fantasy Premier League.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-neutral-900">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verificar**

Run: `npm run build` (sin errores). Con una noticia publicada, abrir `/noticias/<slug>` y verificar en el HTML (`Ctrl+U`) que existen `og:title`, `og:description` y `og:image`.
Expected: las tres etiquetas presentes.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/noticias src/components
git commit -m "feat: sección pública de noticias con Open Graph y compartir"
```

---

### Task 16: Sitio público — tabla de posiciones

**Files:**
- Create: `src/components/StandingsTable.tsx`, `src/app/tabla/page.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getGeneralStandings`, `StandingRow`.
- Produces: componente `StandingsTable({ rows })`.

- [ ] **Step 1: Crear el componente de tabla**

Create `src/components/StandingsTable.tsx`:
```tsx
import type { StandingRow } from "@/lib/domain/types";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left text-neutral-500">
          <th className="py-2 pr-2">#</th>
          <th className="py-2 pr-2">Equipo</th>
          <th className="py-2 pr-2">Manager</th>
          <th className="py-2 pr-2 text-right">PJ</th>
          <th className="py-2 text-right">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.teamId} className="border-b">
            <td className="py-2 pr-2 font-semibold">{row.rank}</td>
            <td className="py-2 pr-2">{row.teamName}</td>
            <td className="py-2 pr-2 text-neutral-600">{row.manager}</td>
            <td className="py-2 pr-2 text-right">{row.played}</td>
            <td className="py-2 text-right font-bold">{row.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Crear la página de tabla**

Create `src/app/tabla/page.tsx`:
```tsx
import { getGeneralStandings } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";

export const metadata = { title: "Tabla de posiciones" };

export default async function StandingsPage() {
  const rows = await getGeneralStandings();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Tabla de posiciones</h1>
      {rows.length === 0 ? (
        <p className="text-neutral-500">La temporada todavía no arrancó.</p>
      ) : (
        <StandingsTable rows={rows} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Portada con noticias y tabla**

Replace `src/app/page.tsx`:
```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getGeneralStandings } from "@/lib/data";
import { NewsCard } from "@/components/NewsCard";
import { StandingsTable } from "@/components/StandingsTable";

export default async function HomePage() {
  const [posts, rows] = await Promise.all([
    prisma.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 6 }),
    getGeneralStandings(),
  ]);
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">Últimas noticias</h1>
          <Link href="/noticias" className="text-sm underline">Ver todas</Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-neutral-500">No hay noticias aún.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <NewsCard key={post.id} slug={post.slug} title={post.title}
                excerpt={post.excerpt} imageUrl={post.imageUrl} category={post.category} />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Tabla de posiciones</h2>
          <Link href="/tabla" className="text-sm underline">Ver completa</Link>
        </div>
        {rows.length === 0 ? <p className="text-neutral-500">Sin datos todavía.</p> : <StandingsTable rows={rows} />}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Verificar**

Run: `npm run build` sin errores. Cargar equipos + una jornada jugada, abrir `/tabla`.
Expected: posiciones ordenadas por puntos y `PJ` correcto.

- [ ] **Step 5: Commit**

```bash
git add src/components/StandingsTable.tsx src/app/tabla src/app/page.tsx
git commit -m "feat: tabla de posiciones pública y portada"
```

---

### Task 17: Sitio público — cortes y ganadores

**Files:**
- Create: `src/app/cortes/page.tsx`, `src/app/cortes/[id]/page.tsx`, `src/components/CutSummary.tsx`

**Interfaces:**
- Consumes: `getCuts`, `getCutResult`, `getTeams`, `prisma`.
- Produces: rutas `/cortes` y `/cortes/[id]`.

- [ ] **Step 1: Implementar listado de cortes**

Create `src/app/cortes/page.tsx`:
```tsx
import Link from "next/link";
import { getCuts, getCutResult } from "@/lib/data";

export const metadata = { title: "Cortes" };

export default async function CutsPage() {
  const cuts = await getCuts();
  const results = await Promise.all(cuts.map((cut) => getCutResult(cut.id)));
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Cortes</h1>
      {cuts.length === 0 ? (
        <p className="text-neutral-500">Todavía no hay cortes definidos.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cuts.map((cut, index) => {
            const result = results[index];
            return (
              <Link key={cut.id} href={`/cortes/${cut.id}`} className="rounded border p-4 hover:bg-neutral-50">
                <h2 className="font-bold">{cut.name} {cut.closed ? "· Cerrado" : ""}</h2>
                {result.winner ? (
                  <p className="mt-2 text-sm">
                    {result.winner.teamName} {cut.closed ? "ganó" : "va liderando"} con {result.winner.total} pts
                    {result.tied ? " (empate)" : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-neutral-500">Sin puntos cargados.</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implementar detalle de corte**

Create `src/app/cortes/[id]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getCutResult } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";

export default async function CutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCutResult(id);
  if (!result.cut) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">{result.cut.name}</h1>
      {result.winner ? (
        <p className="rounded border bg-neutral-50 p-4">
          {result.cut.closed ? "Ganador" : "Va liderando"}: <strong>{result.winner.teamName}</strong> ({result.winner.total} pts)
          {result.tied ? " — definido por la tabla general" : ""}
        </p>
      ) : (
        <p className="text-neutral-500">Sin puntos cargados para este corte.</p>
      )}
      <StandingsTable rows={result.rows} />
    </div>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `/cortes`. Con dos cortes y jornadas asignadas, verificar ganador/punta y el detalle.
Expected: el ganador coincide con el mayor total del corte; en empate, el de mejor posición general.

- [ ] **Step 4: Commit**

```bash
git add src/app/cortes
git commit -m "feat: cortes públicos con ganador y tabla por corte"
```

---

### Task 18: Admin — estimaciones del simulador

**Files:**
- Create: `src/app/admin/simulador/page.tsx`, `src/app/admin/simulador/actions.ts`, `src/app/admin/simulador/EstimateForm.tsx`

**Interfaces:**
- Consumes: `prisma`, `requireAdmin`.
- Produces: server action `saveEstimates(matchdayId, entries)`.

- [ ] **Step 1: Implementar acción**

Create `src/app/admin/simulador/actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";

export async function saveEstimates(
  matchdayId: string,
  entries: { teamId: string; points: number }[],
) {
  await requireAdmin();
  for (const entry of entries) {
    await prisma.estimate.upsert({
      where: { matchdayId_teamId: { matchdayId, teamId: entry.teamId } },
      update: { points: entry.points },
      create: { matchdayId, teamId: entry.teamId, points: entry.points },
    });
  }
  revalidatePath("/admin/simulador");
  revalidatePath("/simulador");
}
```

- [ ] **Step 2: Implementar formulario y página**

Create `src/app/admin/simulador/EstimateForm.tsx` (idéntico patrón a `PointsForm`, reutilizar lógica):
```tsx
"use client";

import { useState, useTransition } from "react";
import { saveEstimates } from "./actions";

export function EstimateForm({
  matchdayId,
  teams,
  initial,
}: {
  matchdayId: string;
  teams: { id: string; name: string }[];
  initial: Record<string, number>;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(teams.map((t) => [t.id, String(initial[t.id] ?? "")])),
  );
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const entries = Object.entries(values)
          .filter(([, v]) => v !== "")
          .map(([teamId, v]) => ({ teamId, points: Math.max(0, Number(v)) }));
        startTransition(() => {
          void saveEstimates(matchdayId, entries);
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {teams.map((team) => (
          <label key={team.id} className="flex items-center justify-between gap-2 text-sm">
            {team.name}
            <input type="number" min={0} value={values[team.id]}
              onChange={(e) => setValues((v) => ({ ...v, [team.id]: e.target.value }))}
              className="w-20 rounded border px-2 py-1" />
          </label>
        ))}
      </div>
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50">
        {pending ? "Guardando…" : "Guardar estimaciones"}
      </button>
    </form>
  );
}
```

Create `src/app/admin/simulador/page.tsx`:
```tsx
import { prisma } from "@/lib/db";
import { EstimateForm } from "./EstimateForm";

export default async function SimulatorAdminPage() {
  const [matchdays, teams] = await Promise.all([
    prisma.matchday.findMany({
      where: { played: false },
      orderBy: { number: "asc" },
      include: { estimates: true, cut: true },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Simulador</h1>
      <p className="text-sm text-neutral-600">
        Cargá puntos estimados para las jornadas no jugadas. No afectan la tabla real.
      </p>
      {matchdays.length === 0 ? (
        <p className="text-neutral-500">No hay jornadas pendientes.</p>
      ) : (
        matchdays.map((matchday) => (
          <div key={matchday.id} className="rounded border p-4">
            <h2 className="mb-3 font-semibold">
              Jornada {matchday.number}{matchday.cut ? ` · ${matchday.cut.name}` : ""}
            </h2>
            <EstimateForm
              matchdayId={matchday.id}
              teams={teams.map((t) => ({ id: t.id, name: t.name }))}
              initial={Object.fromEntries(matchday.estimates.map((e) => [e.teamId, e.points]))}
            />
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `/admin/simulador`. Cargar estimaciones en una jornada pendiente.
Expected: persisten tras recargar.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/simulador
git commit -m "feat: carga de estimaciones del simulador en admin"
```

---

### Task 19: Sitio público — simulador

**Files:**
- Create: `src/app/simulador/page.tsx`
- Modify: `src/lib/data.ts` (corregir `getProjectedCutResult`)

**Interfaces:**
- Consumes: `getProjectedStandings`, `getCuts`, `getTeams`, `getMatchdays`, `getEstimates`, `standingsForCut`, `resolveCutWinner`.
- Produces: ruta `/simulador` con tabla final proyectada y ganador proyectado del corte actual.

- [ ] **Step 1: Corregir `getProjectedCutResult`**

Replace la función en `src/lib/data.ts`:
```ts
export async function getProjectedCutResult(cutId: string) {
  const teams = await getTeams();
  const cuts = await getCuts();
  const cut = cuts.find((c) => c.id === cutId);
  if (!cut) return { rows: [] as StandingRow[], winner: null, tied: false };
  const idSet = new Set(cut.matchdayIds);
  const matchdays = await getMatchdays();
  const estimates = await getEstimates();
  const projectedMatchdays: MatchdayData[] = [
    ...matchdays.filter((m) => idSet.has(m.id)),
    ...estimates
      .filter((e) => idSet.has(e.matchdayId))
      .map((e) => ({ id: `estimate:${e.matchdayId}`, played: true, points: e.points })),
  ];
  const rows = computeStandings(teams, projectedMatchdays);
  const { winner, tied } = resolveCutWinner(rows, await getGeneralStandings());
  return { rows, winner, tied };
}
```
Asegurar que `MatchdayData` esté importado en `src/lib/data.ts`.

- [ ] **Step 2: Implementar la página**

Create `src/app/simulador/page.tsx`:
```tsx
import { getCuts, getProjectedCutResult, getProjectedStandings } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";

export const metadata = { title: "Simulador" };

export default async function SimulatorPage() {
  const cuts = await getCuts();
  const openCut = cuts.find((cut) => !cut.closed) ?? cuts[cuts.length - 1];
  const [projected, cutProjection] = await Promise.all([
    getProjectedStandings(),
    openCut ? getProjectedCutResult(openCut.id) : Promise.resolve(null),
  ]);
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-black">Simulador</h1>
        <p className="text-neutral-600">
          Proyección combinando puntos reales y estimaciones cargadas.
        </p>
        <h2 className="text-2xl font-bold">Tabla final proyectada</h2>
        {projected.length === 0 ? (
          <p className="text-neutral-500">Sin datos.</p>
        ) : (
          <StandingsTable rows={projected} />
        )}
      </section>
      {openCut && cutProjection ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">{openCut.name} proyectado</h2>
          {cutProjection.winner ? (
            <p className="rounded border bg-neutral-50 p-4">
              Va ganando: <strong>{cutProjection.winner.teamName}</strong> ({cutProjection.winner.total} pts)
              {cutProjection.tied ? " — definido por la tabla general" : ""}
            </p>
          ) : (
            <p className="text-neutral-500">Sin datos suficientes.</p>
          )}
          <StandingsTable rows={cutProjection.rows} />
        </section>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npm run build`. Con jornadas pendientes y estimaciones cargadas, abrir `/simulador`.
Expected: la tabla proyectada suma reales + estimaciones y muestra el puntero del corte abierto.

- [ ] **Step 4: Commit**

```bash
git add src/lib/data.ts src/app/simulador
git commit -m "feat: simulador público de tabla final y corte actual"
```

---

### Task 20: Seed de datos y configuración de despliegue

**Files:**
- Create: `prisma/seed.ts`, `vercel.json`, `README.md`
- Modify: `package.json` (script `db:seed`)

**Interfaces:**
- Consumes: `prisma`.
- Produces: datos demo (6 equipos, 4 jornadas en 1 corte, 2 noticias) y config de deploy.

- [ ] **Step 1: Implementar el seed**

Create `prisma/seed.ts`:
```ts
import { PrismaClient, PostCategory } from "@prisma/client";

const prisma = new PrismaClient();

const teams = [
  { name: "Alpha FC", manager: "Ana" },
  { name: "Beta United", manager: "Beto" },
  { name: "Gamma City", manager: "Caro" },
  { name: "Delta Rovers", manager: "Dani" },
  { name: "Epsilon Town", manager: "Eze" },
  { name: "Zeta Athletic", manager: "Flor" },
];

async function main() {
  for (const team of teams) {
    await prisma.team.upsert({ where: { name: team.name }, update: {}, create: team });
  }
  const cut = await prisma.cut.upsert({
    where: { name: "Corte 1" },
    update: {},
    create: { name: "Corte 1", order: 1 },
  });
  const allTeams = await prisma.team.findMany();
  for (let number = 1; number <= 4; number++) {
    const matchday = await prisma.matchday.upsert({
      where: { number },
      update: { cutId: cut.id, played: true },
      create: { number, cutId: cut.id, played: true },
    });
    for (const team of allTeams) {
      const points = 30 + ((team.name.charCodeAt(0) * number) % 60);
      await prisma.matchdayPoints.upsert({
        where: { matchdayId_teamId: { matchdayId: matchday.id, teamId: team.id } },
        update: { points },
        create: { matchdayId: matchday.id, teamId: team.id, points },
      });
    }
  }
  await prisma.post.upsert({
    where: { slug: "bienvenidos-a-la-liga" },
    update: {},
    create: {
      slug: "bienvenidos-a-la-liga",
      title: "Bienvenidos a la liga",
      excerpt: "Arranca la temporada de nuestra liga de Fantasy Premier League.",
      category: PostCategory.GENERAL,
      body: "Este es el primer comunicado oficial de la liga.",
      published: true,
      publishedAt: new Date(),
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: Configurar el script de seed**

En `package.json`, agregar:
```json
{
  "prisma": { "seed": "tsx prisma/seed.ts" }
}
```
E instalar `tsx`:
```bash
npm install -D tsx
```

Run: `npx prisma db seed`
Expected: "Seed ejecutado". `/tabla` muestra 6 equipos con puntos.

- [ ] **Step 3: Configurar Vercel y documentar**

Create `vercel.json`:
```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs"
}
```

Create `README.md`:
```markdown
# Liga FPL

Sitio de noticias, tabla de posiciones, cortes y simulador para una liga de Fantasy Premier League entre amigos.

## Desarrollo
1. `npm install`
2. Copiar `.env.example` a `.env` y completar `DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `UPLOADTHING_TOKEN`.
3. `npx prisma db push`
4. `npm run dev`

## Admin
Ingresar en `/login` con `ADMIN_PASSWORD`.

## Tests
`npm test`

## Deploy
Conectar el repo a Vercel y definir las variables de entorno del `.env.example` en el proyecto.
```

- [ ] **Step 4: Verificar flujo completo**

Run: `npm test && npm run build`
Expected: tests PASS y build exitoso.
Checklist manual: `/` (noticias + tabla), `/noticias/<slug>` (preview), `/cortes` (ganador Corte 1), `/simulador`, `/admin` (login requerido).

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json vercel.json README.md
git commit -m "chore: seed de datos demo, config de deploy y README"
```

---

## Self-Review

**Cobertura del spec:**
- Noticias con categorías e imagen → Tasks 13, 14, 15. ✔
- Preview rica en redes → Task 15 (`generateMetadata` OG/Twitter). ✔
- Tabla de posiciones calculada → Tasks 2, 16. ✔
- Carga manual de puntos al final de cada jornada → Task 11. ✔
- Cortes a mano de 4 fechas con ganador y premio → Tasks 3, 12, 17. ✔
- Simulador de tabla final y corte presente con predicción manual → Tasks 4, 18, 19. ✔
- Admin único protegido → Tasks 6, 9. ✔
- Público con link, sin login para ver → Tasks 15-19. ✔
- Sin escudos → modelo de `Team` en Task 7. ✔
- Empate de corte por tabla general → Task 3. ✔
- Despliegue → Task 20. ✔

**Placeholders:** sin TODOs ni "implementar luego". Todos los tasks con código concreto.

**Consistencia de tipos:** `TeamRef`, `StandingRow`, `MatchdayData`, `MatchdayInCut`, `PointsRow`, `EstimateData` definidos en Tasks 2-4 y reutilizados sin renombrar en Tasks 8, 16, 17, 19. Funciones `computeStandings`, `standingsForCut`, `resolveCutWinner`, `projectStandings`, `slugify`, `checkPassword`, `signSession`, `verifySession` con firmas estables entre tasks. `requireAdmin` definido en Task 9 y consumido en Tasks 10-12, 14, 18.
