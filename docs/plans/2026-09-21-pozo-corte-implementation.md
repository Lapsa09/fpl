# Pozo del Corte — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El ganador de cada corte cobra un pozo configurable (default $180.000) aportado por el resto de los integrantes, editable desde admin y visible en el sitio.

**Architecture:** Setting singleton `LeagueSettings(id=1, cutPotAmount)`; la lógica de reparto es pura (`cutPotBreakdown`) y testeada; admin lo edita desde `/admin/cortes`; las páginas públicas lo leen vía `getCutPot()` en la capa de datos cacheada.

**Tech Stack:** Next.js 15 (App Router, server actions), Prisma 7 (PrismaPg adapter, `db push`), TypeScript, Vitest, Tailwind 4.

**Spec:** `docs/plans/2026-09-21-pozo-corte-design.md`

## Global Constraints

- Admin único: toda server action llama `await requireAdmin()` primero (`src/components/admin/AdminShell.tsx`).
- Sin migrations: el esquema viaja con `npx prisma db push` (Prisma 7 + `@prisma/adapter-pg`, client vía `src/lib/db.ts`).
- Lógica de dominio pura en `src/lib/domain/` con su `.test.ts` (TDD: test rojo primero).
- Tests solo en `src/**/*.test.ts` (Vitest). Correr: `npx vitest run <archivo>`.
- Sin comentarios en el código salvo imprescindibles.
- Valores monetarios enteros ≥ 0. Formato `$180.000` (puntos de miles, sin decimales).
- Sitio en español; copete dinámico según cantidad de participantes.
- Si el monto o el número de aportantes es 0, no se muestra nada de dinero.

---

## Task 1: Modelo `LeagueSettings` + seed

**Files:**
- Modify: `prisma/schema.prisma` (agregar modelo al final, después de `PrizeRule`)
- Modify: `prisma/seed.ts` (upsert de la fila del setting)
- Test: verificación manual contra la DB devuelta por `npm run standings`

**Interfaces:**
- Consumes: contexto existente (`prisma/*`).
- Produces: columna `cutPotAmount` accesible como `prisma.leagueSettings.findUnique({ where: { id: 1 } })` con default `180000`.

- [ ] **Step 1: Agregar el modelo al schema**

En `prisma/schema.prisma`, al final del archivo:

```prisma
model LeagueSettings {
  id           Int @id @default(1)
  cutPotAmount Int @default(180000)
}
```

- [ ] **Step 2: Regenerar el client**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client (v7.10.0)`.

- [ ] **Step 3: Aplicar el esquema a la base**

Run: `npx prisma db push`
Expected: schema sincronizado (no usa `prisma migrate`).

- [ ] **Step 4: Agregar el upsert al seed**

En `prisma/seed.ts`, dentro de `main()`, justo después del bucle de `teams`:

```ts
await prisma.leagueSettings.upsert({
  where: { id: 1 },
  update: {},
  create: { id: 1, cutPotAmount: 180000 },
});
```

- [ ] **Step 5: Ejecutar el seed**

Run: `npm run db:seed`
Expected: termina sin errores (idempotente).

- [ ] **Step 6: Verificar la fila en la base**

Run:
```bash
npx tsx -e "import 'dotenv/config'; import { prisma } from '@/lib/db'; prisma.leagueSettings.findUnique({ where: { id: 1 } }).then((s) => { console.log('cutPotAmount:', s?.cutPotAmount); return prisma.$disconnect(); });"
```
Expected: `cutPotAmount: 180000`.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat: modelo LeagueSettings para el pozo del corte"
```

---

## Task 2: Lógica pura `cutPotBreakdown` + `formatMoney` (TDD)

**Files:**
- Create: `src/lib/domain/pozos.ts`
- Create: `src/lib/domain/pozos.test.ts`
- Modify: `src/lib/format.ts` (agregar `formatMoney`)
- Create: `src/lib/format.test.ts`

**Interfaces:**
- Consumes: nada de otras tasks.
- Produces:
  - `cutPotBreakdown(pot: number, participants: number): CutPot`, con `CutPot = { potAmount: number; contributors: number; quota: number }`.
  - `formatMoney(amount: number): string` → `$180.000`.
  - Task 3 consume `cutPotBreakdown`; Tasks 4 y 5 consumen `formatMoney`.

- [ ] **Step 1: Escribir el test de `cutPotBreakdown` (rojo)**

Create `src/lib/domain/pozos.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cutPotBreakdown } from "./pozos";

describe("cutPotBreakdown", () => {
  it("10 participantes aportan 180000 en 9 cuotas de 20000", () => {
    expect(cutPotBreakdown(180000, 10)).toEqual({ potAmount: 180000, contributors: 9, quota: 20000 });
  });
  it("pot 0", () => {
    expect(cutPotBreakdown(0, 10)).toEqual({ potAmount: 0, contributors: 9, quota: 0 });
  });
  it("1 solo participante -> sin aportantes", () => {
    expect(cutPotBreakdown(180000, 1)).toEqual({ potAmount: 180000, contributors: 0, quota: 0 });
  });
  it("valores negativos se sanean a 0", () => {
    expect(cutPotBreakdown(-100, -3)).toEqual({ potAmount: 0, contributors: 0, quota: 0 });
  });
  it("trunca decimales", () => {
    expect(cutPotBreakdown(180000.9, 10.9)).toEqual({ potAmount: 180000, contributors: 9, quota: 20000 });
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npx vitest run src/lib/domain/pozos.test.ts`
Expected: FAIL — no existe `./pozos`.

- [ ] **Step 3: Implementar `cutPotBreakdown`**

Create `src/lib/domain/pozos.ts`:

```ts
export type CutPot = { potAmount: number; contributors: number; quota: number };

export function cutPotBreakdown(pot: number, participants: number): CutPot {
  const potAmount = Math.max(0, Math.trunc(pot));
  const contributors = Math.max(0, Math.trunc(participants) - 1);
  const quota = contributors > 0 ? Math.trunc(potAmount / contributors) : 0;
  return { potAmount, contributors, quota };
}
```

- [ ] **Step 4: Escribir el test de `formatMoney` (rojo)**

Create `src/lib/format.test.ts`:

```ts
import { expect, it } from "vitest";
import { formatMoney } from "./format";

it("180000 -> $180.000", () => expect(formatMoney(180000)).toBe("$180.000"));
it("20000 -> $20.000", () => expect(formatMoney(20000)).toBe("$20.000"));
it("0 -> $0", () => expect(formatMoney(0)).toBe("$0"));
it("negativo y decimal se sanean", () => expect(formatMoney(-12.9)).toBe("$0"));
```

- [ ] **Step 5: Implementar `formatMoney`**

En `src/lib/format.ts`, agregar:

```ts
export function formatMoney(amount: number): string {
  return `$${Math.max(0, Math.trunc(amount)).toLocaleString("es-AR")}`;
}
```

- [ ] **Step 6: Verificar que todo pasa**

Run: `npx vitest run src/lib/domain/pozos.test.ts src/lib/format.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/domain/pozos.ts src/lib/domain/pozos.test.ts src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: desglose del pozo del corte y formato de dinero"
```

---

## Task 3: Capa de datos `getCutPot`

**Files:**
- Modify: `src/lib/data.ts` (agregar import y función al final)

**Interfaces:**
- Consumes: `CutPot`, `cutPotBreakdown` de `src/lib/domain/pozos`.
- Produces: `getCutPot(): Promise<CutPot>` — Task 5 la consume.

- [ ] **Step 1: Agregar el import**

En `src/lib/data.ts`, en el bloque de imports agregar:

```ts
import { cutPotBreakdown } from "@/lib/domain/pozos";
import type { CutPot } from "@/lib/domain/pozos";
```

- [ ] **Step 2: Agregar `getCutPot`**

Al final de `src/lib/data.ts`:

```ts
export const getCutPot = cache(async (): Promise<CutPot> => {
  const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });
  const participants = await prisma.team.count({ where: { active: true } });
  return cutPotBreakdown(settings?.cutPotAmount ?? 180000, participants);
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0 (sin errores).

- [ ] **Step 4: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat: getCutPot en la capa de datos"
```

---

## Task 4: Admin — `saveCutPot` + tarjeta "Pozo del corte"

**Files:**
- Modify: `src/app/admin/cortes/actions.ts` (agregar `saveCutPot`)
- Modify: `src/app/admin/cortes/page.tsx` (agregar tarjeta de ajuste)

**Interfaces:**
- Consumes: `formatMoney` **no** (el input edita el número entero). Consume `prisma.leagueSettings`.
- Produces: `saveCutPot(formData: FormData)` — el form la usa como acción.

- [ ] **Step 1: Agregar `saveCutPot`**

En `src/app/admin/cortes/actions.ts`, al final:

```ts
export async function saveCutPot(formData: FormData) {
  await requireAdmin();
  const amount = Math.max(0, Math.trunc(Number(formData.get("cutPotAmount") ?? 0)));
  await prisma.leagueSettings.upsert({
    where: { id: 1 },
    update: { cutPotAmount: amount },
    create: { id: 1, cutPotAmount: amount },
  });
  revalidatePath("/admin/cortes");
  revalidatePath("/cortes");
}
```

- [ ] **Step 2: Agregar la tarjeta en la página**

En `src/app/admin/cortes/page.tsx`:
- Import `saveCutPot` desde `"./actions"`.
- Cambiar el `Promise.all` inicial para exponer la variable `settings`:

```tsx
const [cuts, matchdays, settings] = await Promise.all([
  prisma.cut.findMany({ orderBy: { order: "asc" } }),
  prisma.matchday.findMany({ orderBy: { number: "asc" }, include: { cut: true } }),
  prisma.leagueSettings.findUnique({ where: { id: 1 } }),
]);
```
- Agregar, al final del JSX (después de la tarjeta de asignación de jornadas):

```tsx
<AdminCard>
  <form action={saveCutPot} className="flex flex-wrap items-end gap-3">
    <label className={adminLabelClassName}>
      Pozo del ganador del corte (ARS)
      <input
        name="cutPotAmount"
        type="number"
        min={0}
        required
        defaultValue={settings?.cutPotAmount ?? 180000}
        className={adminInputClassName}
      />
    </label>
    <AdminGhostButton>Guardar</AdminGhostButton>
  </form>
</AdminCard>
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit` y `npm run lint`
Expected: ambos limpios.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/cortes/actions.ts src/app/admin/cortes/page.tsx
git commit -m "feat: editar el pozo del corte desde el admin"
```

---

## Task 5: Público — índice y detalle del corte

**Files:**
- Modify: `src/app/cortes/page.tsx` (nota en el header)
- Modify: `src/app/cortes/[id]/page.tsx` (premio junto al ganador)

**Interfaces:**
- Consumes: `getCutPot()` (Task 3), `formatMoney` (Task 2).

- [ ] **Step 1: Nota en el índice de cortes**

En `src/app/cortes/page.tsx`:
- Agregar al top: `import { formatMoney } from "@/lib/format";` y `import { getCutPot } from "@/lib/data";` (junto al `getCuts`/`getCutResult` existente).
- Dentro del componente, obtener `const pot = await getCutPot();`.
- Dentro del `<header>`, después del párrafo de texto existente:

```tsx
{pot.potAmount > 0 && pot.contributors > 0 && (
  <p className="mt-3 text-sm text-muted">
    El ganador de cada corte se lleva {formatMoney(pot.potAmount)} — los otros {pot.contributors} aportan{" "}
    {formatMoney(pot.quota)} cada uno.
  </p>
)}
```

- [ ] **Step 2: Premio en el detalle del corte**

En `src/app/cortes/[id]/page.tsx`:
- Agregar al top: `import { formatMoney } from "@/lib/format";` y `getCutPot` al import existente de `@/lib/data`.
- Dentro del componente, obtener `const pot = await getCutPot();`.
- Dentro del bloque del ganador (`{result.winner ? (...) : (...)}`), después del `<p>` de `result.tied && ...`:

```tsx
{pot.potAmount > 0 && pot.contributors > 0 && (
  <p className="mt-2 text-sm text-muted">
    Premio: {formatMoney(pot.potAmount)} ({formatMoney(pot.quota)} por integrante).
  </p>
)}
```

- [ ] **Step 3: Typecheck + lint + build**

Run: `npx tsc --noEmit` y `npm run lint` y `npm run build`
Expected: todos limpios (build sin necesidad de DB por páginas `force-dynamic`).

- [ ] **Step 4: Verify en vivo (opcional, con servidor y DB)**

Run: `npm run dev`, abrir `/cortes` y `/cortes/<id>`.
Expected: la nota del índice y el premio del detalle muestran `$180.000` y `$20.000`; desde `/admin/cortes` cambiar el monto a 90000 → `/cortes` muestra `$90.000` y `$10.000`.

- [ ] **Step 5: Commit**

```bash
git add src/app/cortes/page.tsx "src/app/cortes/[id]/page.tsx"
git commit -m "feat: mostrar el pozo del ganador del corte en el sitio"
```