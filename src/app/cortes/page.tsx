import { getCuts, getCutResult } from "@/lib/data";
import { CutCard } from "@/components/CutCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cortes" };

export default async function CutsPage() {
  const cuts = await getCuts();
  const results = await Promise.all(
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
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">Fases</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">Cortes</h1>
        <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
          Cada corte es una fase de la temporada. El ganador se define por puntos y, en caso de empate, por la tabla general.
        </p>
      </header>
      {results.length === 0 ? (
        <p className="text-muted">Todavía no hay cortes definidos.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((cut) => (
            <CutCard key={cut.id} {...cut} />
          ))}
        </div>
      )}
    </div>
  );
}