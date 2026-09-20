import { getCuts, getProjectedCutResult, getProjectedStandings, getPrizeRules } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Simulador" };

export default async function SimulatorPage() {
  const cuts = await getCuts();
  const openCut = cuts.find((cut) => !cut.closed) ?? cuts[cuts.length - 1];
  const [projected, cutProjection, prizes] = await Promise.all([
    getProjectedStandings(),
    openCut ? getProjectedCutResult(openCut.id) : Promise.resolve(null),
    getPrizeRules(),
  ]);
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">Proyección</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">Simulador</h1>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
            Combina los puntos reales cargados con las estimaciones del admin para las jornadas sin puntos.
          </p>
        </header>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Tabla final proyectada</h2>
          {projected.length === 0 ? (
            <p className="mt-2 text-muted">Sin datos.</p>
          ) : (
            <div className="mt-4">
              <StandingsTable rows={projected} prizes={prizes} />
            </div>
          )}
        </div>
      </section>

      {openCut && cutProjection ? (
        <section className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">{openCut.name} proyectado</h2>
          {cutProjection.winner ? (
            <div className="rounded-2xl border border-line bg-panel p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">En cabeza (estimado)</p>
              <p className="mt-2 text-2xl font-black tracking-tight">
                {cutProjection.winner.teamName}
                <span className="ml-3 font-mono text-accent">{cutProjection.winner.total} pts</span>
              </p>
              {cutProjection.tied && (
                <p className="mt-1 text-sm text-muted">Empate en puntos, definido por la tabla general.</p>
              )}
            </div>
          ) : (
            <p className="text-muted">Sin estimaciones suficientes.</p>
          )}
          {cutProjection.rows.length > 0 && <StandingsTable rows={cutProjection.rows} prizes={prizes} />}
        </section>
      ) : null}
    </div>
  );
}