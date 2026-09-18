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
