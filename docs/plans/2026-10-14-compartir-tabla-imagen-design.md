# Design: Compartir imagen de la tabla (general y cortes) — Liga FPL

Fecha: 2026-10-14 · Estado: aprobado

## Contexto

Las noticias se comparten con `ShareButtons` (WhatsApp/X/Facebook/copiar link) y, al pegar el link, se ve una tarjeta de preview armada con la imagen OG de la noticia. Las tablas (general en `/tabla` y de cada corte en `/cortes/[id]`) no tienen forma de compartirse: solo muestran el PNG genérico del sitio.

Se quiere compartir un **PNG de la tabla** de la misma manera que una noticia, **sin descargarlo** en el flujo normal: generar la imagen y abrir la hoja de compartir nativa.

Decisiones tomadas con el usuario:
- Qué se comparte: un PNG (tarjeta diseñada), no un link ni una captura fiel de la página.
- Flujo: hoja nativa de compartir archivo; en navegadores sin soporte, **descargar** el PNG como fallback.
- Estética: **tarjeta diseñada** (marca, título, fecha, filas), no captura pixel a pixel del DOM.
- Enfoque técnico: imagen generada en el servidor con `ImageResponse` (`next/og`, incluido en Next 15).
- Alcance: `/tabla` y el detalle de cada corte `/cortes/[id]`.

## Enfoque elegido

`opengraph-image.tsx` colocado en cada ruta, que dibuja la tarjeta con `ImageResponse`. El mismo PNG sirve de:
1. Imagen de preview del link (OG/Twitter) para esa página.
2. Archivo que el botón "Compartir" descarga y manda a la hoja de compartir nativa.

Ventajas: una sola fuente de verdad para preview y share, imagen nítida y consistente, sin dependencias nuevas ni capturar el DOM.

Alternativas descartadas:
- **Captura del DOM con `html-to-image`**: dependencia nueva, problemas de fuentes/imágenes entre navegadores, y choca con la decisión de tarjeta diseñada.
- **Dibujo manual en `<canvas>`**: control total pero mucho más código para lo que `next/og` resuelve.

## Cambios

### Generación de imagen (servidor, `next/og`)
- `src/app/tabla/opengraph-image.tsx` y `src/app/cortes/[id]/opengraph-image.tsx`.
- Cada uno: `export const runtime = "nodejs"` (usa Prisma) y dinámico (datos en vivo; que `next build` no lo pre-renderice sin DB).
- Devuelve `new ImageResponse(<StandingsCard ... />, { width: 1200, height: 630 })` (`size`/`contentType`/`alt` exportados).
- Componente compartido `src/components/share/StandingsCard.tsx`: tarjeta con estilos **inline + flexbox** (requisito de Satori), sin hooks. Usa la fuente por defecto de `next/og` (sin `.ttf` por ahora).

### Contenido de las tarjetas
- **General** (`/tabla`): marca "Liga FPL", título "Tabla general", fecha, todas las filas (posición · equipo · puntos) con el top 3 destacado.
- **Corte** (`/cortes/[id]`): marca, título "Corte N — nombre" + "(cerrado)/(en juego)", bloque del ganador o "en cabeza" (equipo + pts) si existe, filas del corte, y línea del premio si hay pozo configurado.

### Botón de compartir (cliente)
- `src/components/ShareImageButton.tsx` (`"use client"`): props `imagePath`, `fileName`, `title`.
- Flujo: estado "Generando…" → `fetch(imagePath)` → `blob()` → `File` (PNG) → si `navigator.canShare({ files })` usa `navigator.share({ files, title })`; si no, **descarga** (link con `download` + revocación del object URL).
- Cancelar la hoja nativa (`AbortError`) no es error; otra falla muestra "No se pudo generar la imagen".
- Se coloca en `/tabla` y `/cortes/[id]` con el rótulo "Compartir", consistente con `ShareButtons`.

### Metadata / preview del link
- Sumar `generateMetadata` a `/cortes/[id]` (título `Corte N — nombre` + descripción) y completar el de `/tabla` (descripción + `openGraph`/`twitter` `summary_large_image`). La imagen la inyecta Next desde `opengraph-image.tsx`.

## No se hace (YAGNI)
- Compartir desde el índice `/cortes` (son tarjetas, no tablas).
- Editor de la imagen, elección de cantidad de filas, historial, fuentes tipográficas propias.

## Verificación
- `tsc`, `lint` y `build` verdes (las rutas OG son dinámicas → el build no necesita DB).
- Prueba manual abriendo `/tabla/opengraph-image` y `/cortes/<id>/opengraph-image`.
- Compartir: móvil → hoja nativa; escritorio → descarga.
- Sin lógica de dominio nueva → no se agregan `.test.ts` (la convención es para `src/lib/domain`).
