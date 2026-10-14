# Design: Compartir la tabla real como imagen (captura del DOM) — Liga FPL

Fecha: 2026-10-14 · Estado: aprobado

Reemplaza al diseño previo `2026-10-14-compartir-tabla-imagen-design.md` (tarjeta diseñada con `next/og`) para el comportamiento de "compartir la tabla". El usuario prefiere que la imagen sea **la tabla tal cual se ve en la página**.

## Contexto

La implementación anterior generaba una tarjeta diseñada en el servidor con `ImageResponse` (`next/og`) en `/tabla/opengraph-image` y `/cortes/[id]/opengraph-image`, servía de preview OG y de archivo para el botón "Compartir". El usuario pidió cambiarlo: quiere compartir una imagen **de la tabla tal cual está renderizada en la página** (con sus colores de premios, columnas GW/TOT, tipografía, etc.), no una tarjeta aparte.

## Decisiones tomadas con el usuario

- Qué se captura: **solo la `StandingsTable`** (no el podio ni la leyenda de premios).
- Técnica: **captura del DOM en el navegador** con `html-to-image` (dependencia cliente aceptada).
- Preview del link: **se elimina** la imagen OG del servidor para esas rutas (la captura del navegador no puede alimentar crawlers). Se conserva la metadata de título/descripción.
- Enfoque de componentes: **wrapper cliente** que encapsula tabla + botón (no ids globales).
- En `/cortes/[id]`, la imagen **incluye "Corte N"** como título de la tabla (`title` de `StandingsTable` vía `cutTitle`).

## Enfoque elegido

Nuevo componente cliente `src/components/ShareableStandingsTable.tsx` que:
1. Renderiza la `StandingsTable` existente (sin modificarla) dentro de un `<div>` con `ref`, con `bg-background p-6` (área que se captura).
2. Renderiza el control "Compartir" **fuera** del área capturada (no aparece en la imagen).
3. Al hacer click, importa `html-to-image` dinámicamente y captura el `div` a PNG.

Ventajas: fidelidad exacta ("tal cual"), sin trabajo de servidor ni rutas nuevas, reutilizable en ambas páginas.

Alternativas descartadas:
- **`html2canvas`**: más pesado y con peor soporte de CSS moderno (oklch/gradientes de Tailwind 4).
- **Botón que busca la tabla por `id` global**: acoplamiento al DOM; el wrapper con `ref` encapsula mejor.
- **Replicar la tabla en Satori (servidor)**: nunca queda "tal cual" y duplica estilos.

## Cambios

### Nuevo componente cliente
- `src/components/ShareableStandingsTable.tsx` (`"use client"`).
- Props: `rows: StandingRow[]`, `prizes?: PrizeRule[]`, `title?: string`, `fileName: string`, `shareTitle: string`.
- Estructura: `<div ref={captureRef} className="bg-background p-6"><StandingsTable ... /></div>` + bloque "Compartir" (rótulo + botón) fuera del `div` capturado.
- Estado del botón: `idle` / `loading` ("Generando…") / `error` ("No se pudo generar la imagen"). Cancelar la hoja nativa (`AbortError`) no es error.
- Captura: `const { toBlob } = await import("html-to-image")`; `toBlob(captureRef.current, { pixelRatio: 2, backgroundColor: "#170431", cacheBust: true })` → `Blob` → `File` (`image/png`).
- Compartir: si `navigator.canShare?.({ files: [file] })` → `navigator.share({ files: [file], title: shareTitle })`; si no, **descarga** (link con `download`, revocación diferida del object URL con `setTimeout(..., 0)`).

### Uso en las páginas
- `/tabla` (`src/app/tabla/page.tsx`): reemplaza la `StandingsTable` + el bloque "Compartir" por `<ShareableStandingsTable rows title="Tabla anual - Fantasy Premier League" prizes fileName="premier-arg-tabla-general.png" shareTitle="Tabla general — Premier Arg" />`. El `PrizeLegend` sigue mostrándose.
- `/cortes/[id]` (`src/app/cortes/[id]/page.tsx`): envuelve la tabla con el componente, pasando `title={cutTitle(result.cut.order, result.cut.name)}`, `fileName={`premier-arg-corte-${result.cut.order}.png`}` y `shareTitle` equivalente.

### Eliminaciones
- `src/app/tabla/opengraph-image.tsx`
- `src/app/cortes/[id]/opengraph-image.tsx`
- `src/components/share/StandingsCard.tsx`
- `src/components/ShareImageButton.tsx`
- Se conserva la metadata (título/descripción) de ambas páginas; desaparece el `og:image` de esas rutas. El OG estático raíz (`/opengraph-image.png`) y su uso en `layout.tsx`/noticias no se tocan.
- `cutTitle` (`src/lib/domain/cuts.ts`) se mantiene: lo siguen usando la metadata del corte y ahora el título de la tabla.

### Dependencia
- Agregar `html-to-image` a `package.json` (se importa dinámicamente; no entra al bundle inicial).

## Riesgos / a validar en prueba manual
- **Fuentes (`next/font`)**: `html-to-image` intenta incrustar las `@font-face`; si no puede, la captura usa fuente de sistema. Validar que la imagen salga con la tipografía del sitio.
- **Tailwind 4 (oklch/gradientes/sombras)**: se renderiza vía `foreignObject` en el navegador → soportado en navegadores modernos; validar visualmente.
- **Alto del corte**: la pagina `/cortes/[id]` ahora muestra la tabla con encabezado "Corte N" (leve redundancia con el `<h1>` de la página; aceptado).
- **Caché/CORS**: se usa `cacheBust: true`; los recursos son same-origin (fuentes self-hosted), sin imágenes externas en la tabla.

## No se hace (YAGNI)
- Capturar el podio o la leyenda de premios.
- Editor de la imagen, elección de filas, marca de agua.
- Mantener el `og:image` del servidor para estas rutas.
- Compartir desde el índice `/cortes`.

## Verificación
- `tsc`, `lint`, `build` verdes (sin rutas OG nuevas; no hay trabajo de servidor extra).
- Prueba manual en dev (escritorio y móvil): el botón "Compartir imagen" captura la tabla, abre la hoja nativa en móvil y descarga el PNG en escritorio; verificar fidelidad de tipografía/colores.
- Sin lógica de dominio nueva → no se agregan `.test.ts` (convención para `src/lib/domain`).
