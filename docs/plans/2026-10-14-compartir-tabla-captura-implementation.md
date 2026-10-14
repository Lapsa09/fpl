# Compartir la tabla real como imagen (captura del DOM) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compartir/descargar un PNG de la tabla de posiciones tal cual está renderizada en la página, capturando el DOM en el navegador.

**Architecture:** Un componente cliente `ShareableStandingsTable` envuelve la `StandingsTable` existente (sin modificarla) en un `div` con `ref` y captura ese nodo con `html-to-image` (`toBlob`) al hacer click; comparte vía `navigator.share` o descarga. Se eliminan las rutas OG de servidor (`opengraph-image.tsx`) y la tarjeta Satori previa.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Tailwind 4, `html-to-image`.

**Spec:** `docs/plans/2026-10-14-compartir-tabla-captura-design.md`

## Global Constraints

- Stack: Next.js 15.5.25 (App Router), React 19, TypeScript 5, Tailwind 4. Alias de imports `@/`.
- Scripts canónicos: `npm run lint`, `npm run build`, `npm test` (`vitest run`). También mantener `pnpm-lock.yaml` en sync (ver Task 1).
- **No agregar comentarios en el código** (regla del repo).
- **No modificar** `src/components/StandingsTable.tsx` ni nada en `src/lib/domain/`.
- Eliminar exactamente estos archivos: `src/app/tabla/opengraph-image.tsx`, `src/app/cortes/[id]/opengraph-image.tsx`, `src/components/share/StandingsCard.tsx`, `src/components/ShareImageButton.tsx`.
- **Conservar** la metadata (título/descripción/`openGraph`/`twitter`) de `/tabla` y `/cortes/[id]`. No tocar el OG estático raíz (`/opengraph-image.png`) ni sus referencias en `src/app/layout.tsx` / `src/app/noticias/[slug]/page.tsx`.
- El componente nuevo debe llevar `"use client"` y hacer **import dinámico** de `html-to-image` dentro del handler de click.
- Nombres/títulos de compartir: `/tabla` → archivo `premier-arg-tabla-general.png`, título `Tabla general — Premier Arg`; corte → archivo `` `premier-arg-corte-${order}.png` ``, título `cutTitle(order, name)`.
- Sin lógica de dominio nueva → **no** agregar archivos `.test.ts` (la convención es solo para `src/lib/domain`). `npm test` debe seguir verde.

---

### Task 1: Componente `ShareableStandingsTable` + dependencia + integrarlo en `/tabla`

**Files:**
- Create: `src/components/ShareableStandingsTable.tsx`
- Modify: `src/app/tabla/page.tsx`
- Modify: `package.json`, `package-lock.json`, `pnpm-lock.yaml` (vía instalación)

**Interfaces:**
- Consumes: `StandingsTable` desde `@/components/StandingsTable`; tipos `StandingRow` (`@/lib/domain/types`) y `PrizeRule` (`@/lib/domain/prizes`).
- Produces: export nombrado `ShareableStandingsTable` con props `{ rows: StandingRow[]; prizes?: PrizeRule[]; title?: string; fileName: string; shareTitle: string }`. Lo consume Task 2.

- [ ] **Step 1: Instalar la dependencia y sincronizar ambos lockfiles**

```bash
npm install html-to-image
pnpm install --lockfile-only
```

Verificar que quedó en los tres lugares:

```bash
grep -n "html-to-image" package.json package-lock.json pnpm-lock.yaml
```

Esperado: aparece en `package.json` (dependencies) y al menos una vez en cada lockfile. Si `pnpm install --lockfile-only` falla, reportar el error antes de seguir (no continuar con el lockfile de pnpm desincronizado).

- [ ] **Step 2: Crear el componente cliente**

Crear `src/components/ShareableStandingsTable.tsx` con exactamente:

```tsx
"use client";

import { useRef, useState } from "react";
import { StandingsTable } from "@/components/StandingsTable";
import type { StandingRow } from "@/lib/domain/types";
import type { PrizeRule } from "@/lib/domain/prizes";

export function ShareableStandingsTable({
  rows,
  prizes,
  title,
  fileName,
  shareTitle,
}: {
  rows: StandingRow[];
  prizes?: PrizeRule[];
  title?: string;
  fileName: string;
  shareTitle: string;
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function onShare() {
    const node = captureRef.current;
    if (!node) return;
    setState("loading");
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(node, {
        pixelRatio: 2,
        backgroundColor: "#170431",
        cacheBust: true,
      });
      if (!blob) throw new Error("capture failed");
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
      setState("idle");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setState("idle");
        return;
      }
      setState("error");
    }
  }

  return (
    <div>
      <div ref={captureRef} className="p-6">
        <StandingsTable rows={rows} title={title} prizes={prizes} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-muted">Compartir</span>
        <button
          type="button"
          onClick={onShare}
          disabled={state === "loading"}
          className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-foreground disabled:opacity-60"
        >
          {state === "loading" ? "Generando…" : "Compartir imagen"}
        </button>
        {state === "error" ? (
          <span className="text-sm font-semibold text-danger">No se pudo generar la imagen</span>
        ) : null}
      </div>
    </div>
  );
}
```

Nota de diseño: el `div` capturado usa `p-6` (sin fondo propio) y el fondo `#170431` se aplica con la opción `backgroundColor` de `html-to-image`. Así la página no cambia de aspecto (no aparece un rectángulo sólido detrás de la tabla) y la imagen igual sale con el fondo del sitio.

- [ ] **Step 3: Integrar en `/tabla`**

Reemplazar todo el contenido de `src/app/tabla/page.tsx` por:

```tsx
import { getGeneralStandings, getPrizeRules } from "@/lib/data";
import { PrizeLegend } from "@/components/StandingsTable";
import { Podium } from "@/components/Podium";
import { ShareableStandingsTable } from "@/components/ShareableStandingsTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tabla de posiciones",
  description: "Tabla general de la temporada, con premios por puesto.",
  openGraph: {
    title: "Tabla de posiciones",
    description: "Tabla general de la temporada, con premios por puesto.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tabla de posiciones",
    description: "Tabla general de la temporada, con premios por puesto.",
  },
};

export default async function StandingsPage() {
  const rows = await getGeneralStandings();
  const prizes = await getPrizeRules();
  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">General</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">Tabla de posiciones</h1>
      </header>
      {rows.length === 0 ? (
        <p className="text-muted">La temporada todavía no arrancó.</p>
      ) : (
        <div className="space-y-10">
          <Podium rows={rows} />
          <ShareableStandingsTable
            rows={rows}
            title="Tabla anual - Fantasy Premier League"
            prizes={prizes}
            fileName="premier-arg-tabla-general.png"
            shareTitle="Tabla general — Premier Arg"
          />
          <PrizeLegend prizes={prizes} />
        </div>
      )}
    </div>
  );
}
```

(Se quitan los imports de `StandingsTable` y `ShareImageButton`; `PrizeLegend` se mantiene.)

- [ ] **Step 4: Verificar typecheck, lint y build**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Esperado: los tres sin errores. (`/tabla` es `force-dynamic`, el build no necesita DB.)

- [ ] **Step 5: Prueba manual en dev (escritorio)**

```bash
npm run dev
```

Abrir `http://localhost:3000/tabla`, click en **Compartir imagen**. Esperado: se descarga `premier-arg-tabla-general.png`, y al abrirlo se ve la tabla con su título, colores de premios, columnas GW/TOT y tipografía del sitio. Verificar que la imagen **no** incluye el botón "Compartir".

Detener el dev server al terminar.

- [ ] **Step 6: Commit**

```bash
git add src/components/ShareableStandingsTable.tsx src/app/tabla/page.tsx package.json package-lock.json pnpm-lock.yaml
git commit -m "feat: compartir la tabla como imagen capturando el DOM"
```

---

### Task 2: Integrar en `/cortes/[id]` y eliminar los artefactos de servidor anteriores

**Files:**
- Modify: `src/app/cortes/[id]/page.tsx`
- Delete: `src/app/tabla/opengraph-image.tsx`
- Delete: `src/app/cortes/[id]/opengraph-image.tsx`
- Delete: `src/components/share/StandingsCard.tsx`
- Delete: `src/components/ShareImageButton.tsx`

**Interfaces:**
- Consumes: `ShareableStandingsTable` (Task 1) con props `{ rows, prizes?, title?, fileName, shareTitle }`; `cutTitle(order, name)` desde `@/lib/domain/cuts`.
- Produces: nada para tasks posteriores.

- [ ] **Step 1: Integrar `ShareableStandingsTable` en `/cortes/[id]`**

Reemplazar todo el contenido de `src/app/cortes/[id]/page.tsx` por:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCutResult, getPrizeRules, getCutPot } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { cutTitle } from "@/lib/domain/cuts";
import { ShareableStandingsTable } from "@/components/ShareableStandingsTable";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getCutResult(id);
  if (!result.cut) return { title: "Corte no encontrado" };
  const title = cutTitle(result.cut.order, result.cut.name);
  const description = result.winner
    ? `${result.cut.closed ? "Ganador" : "En cabeza"}: ${result.winner.teamName} (${result.winner.total} pts).`
    : `Tabla del corte ${result.cut.name}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCutResult(id);
  if (!result.cut) notFound();
  const prizes = await getPrizeRules();
  const pot = await getCutPot();
  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
          Corte {result.cut.order} {result.cut.closed ? "(cerrado)" : "(en juego)"}
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">{result.cut.name}</h1>
      </header>
      {result.winner ? (
        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
            {result.cut.closed ? "Ganador" : "En cabeza"}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight">
            {result.winner.teamName}
            <span className="ml-3 font-mono text-accent">{result.winner.total} pts</span>
          </p>
          {result.tied && <p className="mt-1 text-sm text-muted">Empate en puntos, definido por la tabla general.</p>}
          {pot.potAmount > 0 && pot.contributors > 0 && (
            <p className="mt-2 text-sm text-muted">
              Premio: {formatMoney(pot.potAmount)} ({formatMoney(pot.quota)} por integrante).
            </p>
          )}
        </div>
      ) : (
        <p className="text-muted">Sin puntos cargados para este corte.</p>
      )}
      {result.rows.length > 0 && (
        <ShareableStandingsTable
          rows={result.rows}
          title={cutTitle(result.cut.order, result.cut.name)}
          prizes={prizes}
          fileName={`premier-arg-corte-${result.cut.order}.png`}
          shareTitle={cutTitle(result.cut.order, result.cut.name)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Eliminar los artefactos de servidor anteriores**

```bash
git rm "src/app/tabla/opengraph-image.tsx" "src/app/cortes/[id]/opengraph-image.tsx" src/components/share/StandingsCard.tsx src/components/ShareImageButton.tsx
```

- [ ] **Step 3: Verificar que no queden referencias**

```bash
grep -rn "StandingsCard\|ShareImageButton" src || echo "sin referencias"
grep -rn "opengraph-image" src
```

Esperado: el primer grep no encuentra nada (imprime "sin referencias"). El segundo solo debe mostrar referencias al estático `/opengraph-image.png` en `src/app/layout.tsx` y `src/app/noticias/[slug]/page.tsx` (esas se conservan). **No** debe quedar ninguna referencia a `src/app/tabla/opengraph-image` ni `src/app/cortes/[id]/opengraph-image`.

- [ ] **Step 4: Verificar typecheck, lint y build**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Esperado: los tres sin errores.

- [ ] **Step 5: Prueba manual en dev (corte)**

```bash
npm run dev
```

Abrir `http://localhost:3000/cortes/<id>` (usar un id real de corte), click en **Compartir imagen**. Esperado: se descarga `premier-arg-corte-<order>.png` con la tabla encabezada por "Corte N". Repetir en escritorio; en móvil (si hay dispositivo) debe abrir la hoja de compartir nativa.

Detener el dev server al terminar.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: captura de la tabla en cortes y limpieza del OG de servidor"
```

---

## Self-Review

**1. Spec coverage:**
- Wrapper cliente tabla + botón → Task 1 Step 2. ✔
- Solo la `StandingsTable` (sin podio/leyenda) → el `div` capturado solo contiene `<StandingsTable>` (Task 1/2). ✔
- `html-to-image`, import dinámico, `toBlob` → Task 1 Step 2. ✔
- Compartir nativo + fallback descarga → Task 1 Step 2. ✔
- `/tabla` sin botón en la imagen, leyenda debajo → Task 1 Step 3. ✔
- `/cortes/[id]` con título "Corte N" y archivo por corte → Task 2 Step 1. ✔
- Eliminar OG de servidor, `StandingsCard` y `ShareImageButton`; conservar metadata y OG raíz → Task 2 Steps 1-3. ✔
- Aceptar dependencia + actualizar ambos lockfiles → Task 1 Step 1. ✔
- Sin tests nuevos; verificación tsc/lint/build + manual → Tasks 1-2 Steps 4-5. ✔

**2. Placeholder scan:** Sin "TBD/TODO"; todo el código está completo y los comandos son exactos.

**3. Type consistency:** `ShareableStandingsTable` exporta `{ rows, prizes, title, fileName, shareTitle }` en Task 1 y se consume con exactamente esos props en Task 2. `cutTitle(order, name)` es la misma firma ya existente en `src/lib/domain/cuts.ts`. `toBlob`/`Blob`/`File`/`navigator.canShare` son API estándar.
