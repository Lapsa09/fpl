# Liga FPL

Sitio de noticias, tabla de posiciones, cortes y simulador para una liga de Fantasy Premier League entre amigos.

## Stack y servicios externos

Además de Vercel (deploy), el proyecto necesita dos servicios gestionados:

| Servicio | Uso | Obligatorio |
| --- | --- | --- |
| Postgres gestionado (recomendado: **Neon**) | Base de datos vía Prisma | Sí |
| **Uploadthing** | Almacenamiento de imágenes de las noticias | Sí |
| **Vercel** | Hosting y deploy | Sí |

Alternativas de base de datos: Neon (recomendado), Supabase, Railway, Vercel Postgres (es Neon por debajo), Aiven o Render.

> **Pooling:** en Vercel (serverless) usá la cadena de conexión *pooled* de Neon (incluye `-pooler`) para no agotar conexiones. Para `prisma db push` en local, usá la cadena *directa* (sin `-pooler`); Neon entrega ambas.

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión a Postgres (`?sslmode=require`). Pooled en Vercel, directa para tareas de CLI. |
| `ADMIN_PASSWORD` | Contraseña del único admin. |
| `AUTH_SECRET` | Cadena larga y aleatoria para firmar la cookie de sesión (ej. `openssl rand -hex 32`). |
| `UPLOADTHING_TOKEN` | Token de la app creada en el dashboard de Uploadthing. |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (`http://localhost:3000` en local; el dominio real en producción). Se usa para las URLs absolutas del preview OG/Twitter. |

## Desarrollo

1. `npm install`
2. Copiar `.env.example` a `.env` y completar las variables.
3. `npx prisma db push`
4. `npm run dev`

## Admin

Ingresar en `/login` con `ADMIN_PASSWORD`.

## Tests

`npm test`

## Deploy

1. Crear la base en el proveedor elegido y copiar la cadena *pooled*.
2. Crear la app en Uploadthing y copiar el token.
3. Conectar el repo a Vercel.
4. Definir las 5 variables del `.env.example` en el proyecto de Vercel.
5. Deploy.

## Opcionales

- Dominio propio (DNS en Vercel).
- Monitoreo de errores: Sentry.
- Analytics: Vercel Web Analytics o Plausible.

No hacen falta autenticación de terceros, Redis, email transaccional, CDN ni cron.
