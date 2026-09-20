import Link from "next/link";
import { prisma } from "@/lib/db";
import { getGeneralStandings, getCuts, getCutResult, getPrizeRules } from "@/lib/data";
import { NewsCard } from "@/components/NewsCard";
import { StandingsTable, PrizeLegend } from "@/components/StandingsTable";
import { Podium } from "@/components/Podium";
import { CutCard } from "@/components/CutCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, rows, cuts, prizes] = await Promise.all([
    prisma.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 6 }),
    getGeneralStandings(),
    getCuts(),
    getPrizeRules(),
  ]);
  const cutResults = await Promise.all(
    cuts.map(async (cut) => {
      const result = await getCutResult(cut.id);
      return {
        ...cut,
        winnerTeam: result.winner?.teamName ?? null,
        winnerPoints: result.winner?.total ?? null,
        tied: result.tied,
      };
    }),
  );

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
            Amigos Fútbol Fantasía Siempre
          </p>
          <h1 className="mt-3 text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
            Premier <span className="text-accent">Arg</span>
            <span className="mt-2 block text-xl font-medium normal-case tracking-[0.32em] text-muted md:text-2xl">
              Fantasy League
            </span>
          </h1>
          <p className="mt-5 max-w-[45ch] leading-relaxed text-muted">
            La liga de los pibes: tabla anual, premios para los de arriba y prenda para los de abajo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tabla" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
              Ver la tabla
            </Link>
            <Link href="/noticias" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent">
              Últimas noticias
            </Link>
          </div>
        </div>
        <Podium rows={rows} />
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">Últimas noticias</h2>
          <Link href="/noticias" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
            Ver todas
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="mt-4 text-muted">No hay noticias aún. El primer comunicado aparece acá.</p>
        ) : (
          <div className="mt-4">
            {posts.map((post, i) => (
              <NewsCard
                key={post.id}
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                category={post.category}
                publishedAt={post.publishedAt}
                index={i + 1}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">Tabla anual</h2>
          <Link href="/tabla" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
            Ver completa
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="text-muted">Sin datos todavía.</p>
        ) : (
          <div className="space-y-4">
            <StandingsTable rows={rows} title="Tabla anual - Fantasy Premier League" prizes={prizes} />
            <PrizeLegend prizes={prizes} />
          </div>
        )}
      </section>

      {cutResults.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">Cortes</h2>
            <Link href="/cortes" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cutResults.slice(0, 3).map((cut) => (
              <CutCard key={cut.id} {...cut} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}