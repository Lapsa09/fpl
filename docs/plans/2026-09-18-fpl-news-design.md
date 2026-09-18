# FPL Liga de Amigos — Sitio de noticias y posiciones

Fecha: 2026-09-18
Estado: Aprobado

## Resumen

Web tipo diario deportivo para una liga de Fantasy Premier League entre amigos (5-10 equipos). Noticias con imágenes y preview rica en redes, tabla de posiciones de temporada, tabla/cortes de 4 fechas con ganador por corte, y un simulador de proyecciones por fechas restantes.

## Requisitos confirmados

- Admin único: solo una persona publica noticias, carga puntos y gestiona todo. Los demás solo leen.
- Web pública con link: sin login para ver; admin protegido por contraseña.
- Noticias: traspasos, declaraciones de entrenadores, comunicados de clubes, general. Imagen destacada por noticia.
- Sharing: preview rica obligatoria (og:image, título, bajada) al pegar el link en WhatsApp/X/Facebook.
- Tabla de posiciones: los puntos de cada equipo se cargan manualmente al final de cada jornada; las posiciones se actualizan automáticamente (se calculan, no se guardan).
- Cortes de 4 fechas definidos a mano por el admin (no necesariamente bloques fijos/consecutivos). Ganador de cada corte = mayor suma de puntos de sus jornadas → premio.
- Simulador: el admin carga puntajes estimados por equipo por cada fecha restante; proyecta la tabla final de temporada y el ganador del corte actual.

## Stack elegido (Opción A)

- Next.js (App Router) + TypeScript + TailwindCSS, desplegado en Vercel.
- Postgres en Neon (capa gratis) como base de datos.
- Uploadthing (capa gratis) para subida de imágenes.
- Admin: cookie firmada con contraseña única, sin sistema de usuarios.
- Despliegue automático desde GitHub; preview por PR, producción desde `main`.

## Modelo de datos

- `teams`: nombre, manager, activo. Sin escudos ni colores.
- `matchdays`: número, corte al que pertenece (asignado a mano).
- `matchday_points`: (jornada_id, equipo_id, puntos).
- `cuts`: etiqueta del corte y las jornadas que lo componen (relación con `matchdays`).
- `posts`: título, bajada, categoría (traspasos | declaraciones | comunicados | general), cuerpo, imagen destacada, slug único, fecha de publicación, publicado (borrador/público).

Regla: las posiciones, tablas y ganadores de corte siempre se derivan sumando puntos al vuelo. Nunca se guardan.

## Funcionalidades

- **Portada** `/`: noticias recientes con imagen + widgets de tabla general y punta del corte actual.
- **Noticias** `/noticias` y `/noticias/[slug]`: listado y detalle con Open Graph tags y botones de compartir (WhatsApp, X, Facebook, copiar link).
- **Tabla** `/tabla`: tabla de posiciones general de temporada, calculada por suma de puntos.
- **Cortes** `/cortes`: detalle de cada corte, sus jornadas y su ganador; punta parcial si no cerró. Vista de tabla por corte (puntos acumulados en ese corte).
- **Simulador** `/simulador`: proyecciones con puntajes estimados cargados en admin (guardados como estimaciones, separadas de los puntos reales).
- **Admin** `/admin/*`: CRUD de equipos, jornadas (carga de puntos por equipo), cortes (asignar jornadas), noticias (con subida de imagen), y estimaciones del simulador.

## Manejo de errores / edge cases

- Jornada o equipo sin puntos cargados: se cuenta con 0 y se marca el dato como pendiente ("fecha sin cargar").
- Sin datos: estados vacíos amigables ("no hay noticias aún").
- Empate en corte: gana quien esté más arriba en la tabla general (criterio documentado).
- Simulador sin estimaciones: muestra solo lo real cargado, no rompe.
- Imagen fallida: noticia sin imagen (fallback) + error visible en el panel.
- Admin sin sesión → redirige a login; rutas inexistentes → 404.
- Formularios admin validan (puntos ≥ 0, slug único). Errores de DB → mensaje amigable en panel.
- Sin manejo de concurrencia: un solo admin, volumen bajo.

## Testing y verificación

- Vitest: cálculo de suma de puntos, orden de tabla, ganador de corte (con criterio de empate), proyecciones del simulador.
- Pruebas de formularios admin: flujo feliz + casos inválidos.
- Verificación manual de OG tags con validator de Facebook/WhatsApp sobre una noticia publicada.
- Checklist manual del dueño: crear equipo, cargar jornadas, armar corte, publicar noticia, probar preview en WhatsApp, correr simulador.
- Estética: skill `frontend-design` en implementación (diario deportivo, tipografía editorial).

## Fuera de alcance (YAGNI)

- Sistema de cuentas multi-usuario, roles, comentarios, likes.
- Escudos/logos por equipo.
- Importación automática desde la API de la FPL oficial.
- Historial de temporadas pasadas.