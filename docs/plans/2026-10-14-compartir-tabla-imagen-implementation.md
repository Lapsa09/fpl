# Compartir tabla como imagen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir compartir (o descargar como fallback) un PNG de la tabla general y de cada corte, generado en el servidor y enviado a la hoja de compartir nativa.

**Architecture:** Cada ruta expone un archivo `opengraph-image.tsx` que dibuja una tarjeta con `ImageResponse` (`next/og`). Ese mismo PNG sirve de preview OG del link y de archivo para compartir. Un componente cliente `ShareImageButton` baja el PNG y usa `navigator.share({ files })`, con descarga como fallback.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, `next/og` (Satori), Prisma (lectura vía `@/lib/data`). Sin dependencias nuevas.

**Spec:** `docs/plans/2026-10-14-compartir-tabla-imagen-design.md`

## Global Constraints

- Sin dependencias nuevas: usar `ImageResponse` de `next/og` (ya incluido en Next 15).
- Rutas de imagen OG: cada archivo exporta `runtime = "nodejs"`, `dynamic = "force-dynamic"`, `size = { width: 1200, height: 630 }`, `contentType = "image/png"` y `alt`.
- La tarjeta vive en `src/components/share/StandingsCard.tsx`: **solo estilos inline** (nada de clases Tailwind) y **todo contenedor con `display: "flex"` explícito** (requisito de Satori). Sin hooks.
- Fuente: la por defecto de `next/og` (no se agrega `.ttf`).
- Marca: "Premier Arg". Colores exactos (de `src/app/globals.css`): background `#170431`, panel `#220844`, borde `#5e2fa3`, foreground `#ffffff`, muted `#c9b6ea`, accent `#2dd4ff`, gold `#ffc21a`.
- Máximo 10 filas en la tarjeta (`rows.slice(0, 10)`).
- Copy en español (es-AR). Dinero con `formatMoney` de `@/lib/format`.
- Sin comentarios en el código.
- Sin `.test.ts` nuevos (decisión del design: no hay lógica de dominio nueva). Verificación = `tsc` + `lint` + `build` + prueba manual del PNG.
- El build **no** ejecuta las rutas OG (son dinámicas), así que un error de Satori no se ve en `next build`; por eso cada task incluye la prueba manual por HTTP.

---

## File Structure

- `src/components/share/StandingsCard.tsx` — tarjeta Satori (nueva). Responsabilidad: dibujar marca/título/filas/ganador/premio con estilos inline.
- `src/components/ShareImageButton.tsx` — botón cliente (nuevo). Responsabilidad: bajar el PNG y compartirlo o descargarlo.
- `src/app/tabla/opengraph-image.tsx` — PNG de la tabla general (nuevo).
- `src/app/cortes/[id]/opengraph-image.tsx` — PNG de un corte (nuevo).
- `src/app/tabla/page.tsx` — metadata + sección "Compartir" (modificado).
- `src/app/cortes/[id]/page.tsx` — metadata + sección "Compartir" (modificado).

### Task 1: Tarjeta `StandingsCard` + PNG de la tabla general

**Files:**
- Create: `src/components/share/StandingsCard.tsx`
- Create: `src/app/tabla/opengraph-image.tsx`

**Interfaces:**
- Consumes: `StandingRow` de `@/lib/domain/types` (`{ teamId, teamName, manager, played, total, rank }`); `getGeneralStandings()` de `@/lib/data`; `formatDate()` de `@/lib/format`.
- Produces: componente `StandingsCard` con props:
  ```ts
  {
    title: string;
    subtitle?: string;
    rows: StandingRow[];
    winner?: { label: string; name: string; points: number } | null;
    prize?: string | null;
  }
  ```

- [ ] **Step 1: Crear la tarjeta `src/components/share/StandingsCard.tsx`**

```tsx
import type { StandingRow } from "@/lib/domain/types";

const COLOR = {
  background: "#170431",
  panel: "#220844",
  border: "#5e2fa3",
  foreground: "#ffffff",
  muted: "#c9b6ea",
  accent: "#2dd4ff",
  gold: "#ffc21a",
};

export function StandingsCard({
  title,
  subtitle,
  rows,
  winner,
  prize,
}: {
  title: string;
  subtitle?: string;
  rows: StandingRow[];
  winner?: { label: string; name: string; points: number } | null;
  prize?: string | null;
}) {
  const visible = rows.slice(0, 10);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "36px 48px",
        color: COLOR.foreground,
        background: `linear-gradient(135deg, #230848 0%, ${COLOR.background} 60%)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 30, fontWeight: 900, letterSpacing: -1 }}>
          <span>PREMIER</span>
          <span style={{ color: COLOR.accent, marginLeft: 8 }}>ARG</span>
        </div>
        {subtitle ? <div style={{ display: "flex", fontSize: 20, color: COLOR.muted }}>{subtitle}</div> : null}
      </div>

      <div style={{ display: "flex", marginTop: 12, fontSize: 38, fontWeight: 900, letterSpacing: -1 }}>{title}</div>

      {winner ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 12,
            padding: "10px 16px",
            borderRadius: 14,
            background: COLOR.panel,
            border: `1px solid ${COLOR.border}`,
          }}
        >
          <span style={{ display: "flex", fontSize: 15, letterSpacing: 3, color: COLOR.muted, marginRight: 14 }}>
            {winner.label.toUpperCase()}
          </span>
          <span style={{ display: "flex", fontSize: 26, fontWeight: 800 }}>{winner.name}</span>
          <span style={{ display: "flex", fontSize: 26, fontWeight: 800, color: COLOR.accent, marginLeft: 12 }}>
            {winner.points} pts
          </span>
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
        {visible.map((row) => (
          <div
            key={row.teamId}
            style={{
              display: "flex",
              alignItems: "center",
              height: 34,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                display: "flex",
                width: 48,
                justifyContent: "center",
                fontSize: 19,
                fontWeight: 900,
                color: row.rank <= 3 ? COLOR.gold : COLOR.muted,
              }}
            >
              {row.rank}
            </span>
            <span style={{ display: "flex", flex: 1, fontSize: 19, fontWeight: 700 }}>{row.teamName}</span>
            <span style={{ display: "flex", width: 84, justifyContent: "flex-end", fontSize: 19, fontWeight: 700 }}>
              {row.total}
            </span>
          </div>
        ))}
      </div>

      {prize ? <div style={{ display: "flex", marginTop: 12, fontSize: 18, color: COLOR.muted }}>{prize}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Crear la ruta `src/app/tabla/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { getGeneralStandings } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { StandingsCard } from "@/components/share/StandingsCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Tabla general — Premier Arg";

export default async function Image() {
  const rows = await getGeneralStandings();
  return new ImageResponse(
    <StandingsCard title="Tabla general" subtitle={`Premier Arg · ${formatDate(new Date())}`} rows={rows} />,
    { ...size },
  );
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: exit 0, sin errores.

- [ ] **Step 4: Verificar lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`.

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: build OK. En la tabla de rutas, `/tabla` debe figurar como dinámica (`ƒ`), no estática (`○`).

- [ ] **Step 6: Prueba manual del PNG (requiere DB reachable)**

Run: `npm run dev` en segundo plano; luego `curl -sS -o /tmp/tabla.png http://localhost:3000/tabla/opengraph-image && ls -l /tmp/tabla.png`
Expected: HTTP 200 y un archivo PNG de más de 5 KB. Detener el dev server.
Si la DB no está disponible, anotar en el reporte que esta prueba quedó pendiente.

- [ ] **Step 7: Commit**

```bash
git add src/components/share/StandingsCard.tsx src/app/tabla/opengraph-image.tsx
git commit -m "feat: tarjeta de tabla y PNG de la tabla general"
```

---

### Task 2: Botón de compartir + metadata en `/tabla`

**Files:**
- Create: `src/components/ShareImageButton.tsx`
- Modify: `src/app/tabla/page.tsx`

**Interfaces:**
- Consumes: ruta PNG creada en Task 1 (`/tabla/opengraph-image`).
- Produces: componente `ShareImageButton` con props `{ imagePath: string; fileName: string; title: string }`.

- [ ] **Step 1: Crear `src/components/ShareImageButton.tsx`**

```tsx
"use client";

import { useState } from "react";

export function ShareImageButton({
  imagePath,
  fileName,
  title,
}: {
  imagePath: string;
  fileName: string;
  title: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function onShare() {
    setState("loading");
    try {
      const res = await fetch(imagePath);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
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
    <div className="flex flex-wrap items-center gap-3">
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
  );
}
```

- [ ] **Step 2: Metadata de `/tabla`**

En `src/app/tabla/page.tsx`, reemplazar:

```ts
export const metadata = { title: "Tabla de posiciones" };
```

por:

```ts
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
```

- [ ] **Step 3: Sección "Compartir" en `/tabla`**

En `src/app/tabla/page.tsx`, agregar el import:

```tsx
import { ShareImageButton } from "@/components/ShareImageButton";
```

y dentro de la rama con filas, después de `<PrizeLegend prizes={prizes} />`, agregar:

```tsx
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-muted">Compartir</span>
            <ShareImageButton
              imagePath="/tabla/opengraph-image"
              fileName="premier-arg-tabla-general.png"
              title="Tabla general — Premier Arg"
            />
          </div>
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Verificar lint**

Run: `npm run lint`
Expected: sin warnings/errores.

- [ ] **Step 6: Verificar build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 7: Prueba manual de la página**

Run: `npm run dev` y abrir `http://localhost:3000/tabla`
Expected: aparece la sección "Compartir" con el botón "Compartir imagen"; en un navegador de escritorio el click descarga un `.png`.

- [ ] **Step 8: Commit**

```bash
git add src/components/ShareImageButton.tsx src/app/tabla/page.tsx
git commit -m "feat: compartir la tabla general como imagen"
```

---

### Task 3: PNG de cada corte

**Files:**
- Create: `src/app/cortes/[id]/opengraph-image.tsx`

**Interfaces:**
- Consumes: `StandingsCard` (Task 1); `getCutResult(cutId)` y `getCutPot()` de `@/lib/data`; `formatMoney` de `@/lib/format`.
  - `getCutResult` devuelve `{ cut: { id, name, order, closed, matchdayIds } | null, rows: StandingRow[], winner: StandingRow | null, tied: boolean }`.
  - `getCutPot()` devuelve `{ potAmount: number; contributors: number; quota: number }`.
- Produces: ruta PNG servida en `/cortes/<id>/opengraph-image`.

- [ ] **Step 1: Crear `src/app/cortes/[id]/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { getCutResult, getCutPot } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { StandingsCard } from "@/components/share/StandingsCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Corte — Premier Arg";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, pot] = await Promise.all([getCutResult(id), getCutPot()]);
  const winner = result.winner
    ? {
        label: result.cut?.closed ? "Ganador" : "En cabeza",
        name: result.winner.teamName,
        points: result.winner.total,
      }
    : null;
  const prize =
    pot.potAmount > 0 && pot.contributors > 0
      ? `Premio: ${formatMoney(pot.potAmount)} (${formatMoney(pot.quota)} por integrante)`
      : null;
  return new ImageResponse(
    <StandingsCard
      title={result.cut ? `Corte ${result.cut.order} — ${result.cut.name}` : "Corte"}
      subtitle={result.cut?.closed ? "Cerrado" : "En juego"}
      rows={result.rows}
      winner={winner}
      prize={prize}
    />,
    { ...size },
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Verificar lint**

Run: `npm run lint`
Expected: sin warnings/errores.

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: build OK; `/cortes/[id]` dinámica (`ƒ`).

- [ ] **Step 5: Prueba manual del PNG (requiere DB reachable)**

Run: (con `npm run dev` corriendo) `curl -sS -o /tmp/corte.png "http://localhost:3000/cortes/<ID_DE_UN_CORTE>/opengraph-image" && ls -l /tmp/corte.png`
Expected: HTTP 200 y PNG de más de 5 KB, con el nombre del corte, el ganador (si hay) y el premio (si hay pozo).
Si no se conoce un id de corte válido, listarlo con `npm run standings` o `cut` desde la DB; si la DB no está disponible, anotarlo como pendiente.

- [ ] **Step 6: Commit**

```bash
git add src/app/cortes/[id]/opengraph-image.tsx
git commit -m "feat: PNG de la tabla de cada corte"
```

---

### Task 4: Metadata + botón de compartir en `/cortes/[id]`

**Files:**
- Modify: `src/app/cortes/[id]/page.tsx`

**Interfaces:**
- Consumes: `ShareImageButton` (Task 2), ruta PNG (Task 3), `getCutResult`.

- [ ] **Step 1: Metadata dinámica**

En `src/app/cortes/[id]/page.tsx`, agregar `Metadata` al primer import de Next:

```tsx
import type { Metadata } from "next";
```

Y antes del componente `CutDetailPage`, agregar:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getCutResult(id);
  if (!result.cut) return { title: "Corte no encontrado" };
  const title = `Corte ${result.cut.order} — ${result.cut.name}`;
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
```

- [ ] **Step 2: Sección "Compartir"**

Agregar el import:

```tsx
import { ShareImageButton } from "@/components/ShareImageButton";
```

Y al final del JSX (después de la línea de `StandingsTable`), antes del cierre `</div>`:

```tsx
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-muted">Compartir</span>
        <ShareImageButton
          imagePath={`/cortes/${id}/opengraph-image`}
          fileName={`premier-arg-corte-${result.cut.order}.png`}
          title={`Corte ${result.cut.order} — ${result.cut.name}`}
        />
      </div>
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Verificar lint**

Run: `npm run lint`
Expected: sin warnings/errores.

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 6: Prueba manual**

Run: `npm run dev` y abrir un detalle de corte (`/cortes/<ID>`).
Expected: aparece "Compartir" con el botón; el click descarga el PNG en escritorio. El `<title>` de la pestaña muestra `Corte N — nombre`.

- [ ] **Step 7: Commit**

```bash
git add "src/app/cortes/[id]/page.tsx"
git commit -m "feat: compartir y metadata de cada corte"
```

---

## Self-Review

- **Cobertura del spec:** generación server-side con `next/og` (Tasks 1, 3); tarjeta diseñada con marca/título/fecha/filas (Task 1); ganador + premio en cortes (Task 3); botón con hoja nativa y fallback a descarga (Task 2); preview OG + metadata (Tasks 2, 4); alcance `/tabla` + `/cortes/[id]` (Tasks 1–4); sin tests de dominio (Global Constraints). Cubierto.
- **Placeholders:** ninguno; todo el código está completo.
- **Consistencia de tipos:** `StandingsCard` se define en Task 1 y se consume con las mismas props en Tasks 3; `ShareImageButton` props `{ imagePath, fileName, title }` idénticas en Tasks 2 y 4; `getCutResult`/`getCutPot` usados con la firma existente en `src/lib/data.ts`.
- **Riesgo conocido:** el render de Satori solo se ejerce en runtime (no en `next build`); cada task incluye la prueba manual por HTTP para cubrirlo.
