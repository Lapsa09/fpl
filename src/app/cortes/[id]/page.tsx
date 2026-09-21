import { notFound } from "next/navigation";
import { getCutResult, getPrizeRules, getCutPot } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { StandingsTable } from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export default async function CutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCutResult(id);
  if (!result.cut) notFound();
  const prizes = await getPrizeRules();
  const pot = await getCutPot();
  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
          Corte {result.cut.order} {result.cut.closed ? "(cerrado)" : "(en juego)"}
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">{result.cut.name}</h1>
      </header>
      {result.winner ? (
        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
            {result.cut.closed ? "Ganador" : "En cabeza"}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight">
            {result.winner.teamName}
            <span className="ml-3 font-mono text-accent">{result.winner.total} pts</span>
          </p>
          {result.tied && <p className="mt-1 text-sm text-muted">Empate en puntos, definido por la tabla general.</p>}
          {pot.potAmount > 0 && pot.contributors > 0 && (
            <p className="mt-2 text-sm text-muted">
              Premio: {formatMoney(pot.potAmount)} ({formatMoney(pot.quota)} por integrante).
            </p>
          )}
        </div>
      ) : (
        <p className="text-muted">Sin puntos cargados para este corte.</p>
      )}
      {result.rows.length > 0 && <StandingsTable rows={result.rows} prizes={prizes} />}
    </div>
  );
}
