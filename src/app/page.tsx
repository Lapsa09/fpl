import Link from "next/link";
import { prisma } from "@/lib/db";
import { getGeneralStandings } from "@/lib/data";
import { NewsCard } from "@/components/NewsCard";
import { StandingsTable } from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, rows] = await Promise.all([
    prisma.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 6 }),
    getGeneralStandings(),
  ]);
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">Últimas noticias</h1>
          <Link href="/noticias" className="text-sm underline">Ver todas</Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-neutral-500">No hay noticias aún.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <NewsCard key={post.id} slug={post.slug} title={post.title}
                excerpt={post.excerpt} imageUrl={post.imageUrl} category={post.category} />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Tabla de posiciones</h2>
          <Link href="/tabla" className="text-sm underline">Ver completa</Link>
        </div>
        {rows.length === 0 ? <p className="text-neutral-500">Sin datos todavía.</p> : <StandingsTable rows={rows} />}
      </section>
    </div>
  );
}