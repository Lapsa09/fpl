import "dotenv/config";
import { PrismaClient, PostCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
  const posts = [
    {
      slug: "bienvenidos-a-la-liga",
      title: "Bienvenidos a la liga",
      excerpt: "Arranca la temporada de nuestra liga de Fantasy Premier League.",
      category: PostCategory.GENERAL,
      body: "Este es el primer comunicado oficial de la liga.",
      published: true,
      publishedAt: new Date(),
    },
    {
      slug: "reglas-del-torneo",
      title: "Reglas del torneo",
      excerpt: "Cada corte son 4 fechas y el ganador se define por la tabla general.",
      category: PostCategory.DECLARATIONS,
      body: "Cargamos los puntos de cada jornada al finalizarla y cerramos cortes de 4 fechas con premio para el líder general.",
      published: true,
      publishedAt: new Date(),
    },
  ];
  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
