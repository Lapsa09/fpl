# Design: Pozo del ganador del corte — Liga FPL

Fecha: 2026-09-21 · Estado: aprobado

## Contexto

Cada corte define un ganador por puntos (empate → tabla general). A eso se le suma una regla de dinero: el ganador del corte se lleva un pozo acumulado de **$180.000**, que aportan los otros 9 integrantes ($20.000 cada uno). El monto debe poder editarse de cara a una próxima temporada.

Decisiones tomadas con el usuario:
- Mecánica: el ganador cobra $180.000 → 9 × $20.000.
- Ámbito del monto: **global**, un único valor editable en admin que aplica a todos los cortes.
- Ubicación pública: índice de cortes (nota) + detalle de cada corte (junto al ganador).

## Enfoque elegido

Setting singleton editable (`LeagueSettings`) en vez de env var o monto por corte. Permite cambiar el valor desde admin sin redeploy y deja espacio para futuros ajustes de temporada.

## Cambios

### Esquema (Prisma, `db push`)
- Nuevo modelo `LeagueSettings`: `id Int @id @default(1)`, `cutPotAmount Int @default(180000)`.
- El seed hace `upsert` de la fila `id=1` con el default.

### Lógica pura (con tests)
- `src/lib/domain/pozos.ts`:
  - `cutPotBreakdown(pot, participantes): { potAmount, contributors, quota }`.
  - `contributors = max(participantes - 1, 0)`.
  - `quota = contributors > 0 ? pot / contributors : 0` (redondeo al entero: `Math.trunc`).
  - Salvaguardas: pot negativo → 0; participantes < 2 → `quota = 0`.
  - Además un `formatMoney(n)` → `$180.000` (agrupación de miles con punto, sin decimales). Se ubica en `src/lib/format.ts`.
- Tests en `src/lib/domain/pozos.test.ts` y `src/lib/format.test.ts`: reparto nominal (10 equipos → 180000/9 = 20000), bordes (pot 0, 1 equipo, pot negativo), formato.

### Lectura
- `getCutPot()` en `src/lib/data.ts` (cacheada): lee `LeagueSettings`, cuenta `teams where active`, devuelve `{ potAmount, quota, contributors }` vía `cutPotBreakdown`.

### Admin
- `/admin/cortes`: tarjeta "Ajustes" con input en `$` (precargado con el valor actual) + acción `saveCutPot(formData)`.
- `saveCutPot`: `requireAdmin()`, valida entero ≥ 0, `upsert` del singleton, `revalidatePath("/admin/cortes")` y `revalidatePath("/cortes")`.

### Público
- `/cortes`: nota en el header — "El ganador de cada corte se lleva $180.000 (los otros 9 aportan $20.000 cada uno)" con copete dinámico según `contributors`.
- `/cortes/[id]`: junto al bloque del ganador, "Premio: $180.000" + "($20.000 por integrante)".
- Si `potAmount ≤ 0`: no se muestra nada de dinero.

## No se hace (YAGNI)
- Montos por corte, acumulación entre cortes, historial de temporadas, autorizaciones por rol (admin único).

## Deploy / otras PCs
- `npx prisma db push` (schema nuevo) + `npx prisma db seed` (crea la fila del setting).
- Vercel build ya corre `prisma generate && next build`.