import { getCuts, getProjectedCutResult, getProjectedStandings } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Simulador" };

export default async function SimulatorPage() {
  const cuts = await getCuts();
  const openCut = cuts.find((cut) => !cut.closed) ?? cuts[cuts.length - 1];
  const [projected, cutProjection] = await Promise.all([
    getProjectedStandings(),
    openCut ? getProjectedCutResult(openCut.id) : Promise.resolve(null),
  ]);
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-black">Simulador</h1>
        <p className="text-neutral-600">
          Proyección combinando puntos reales y estimaciones cargadas.
        </p>
        <h2 className="text-2xl font-bold">Tabla final proyectada</h2>
        {projected.length === 0 ? (
          <p className="text-neutral-500">Sin datos.</p>
        ) : (
          <StandingsTable rows={projected} />
        )}
      </section>
      {openCut && cutProjection ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">{openCut.name} proyectado</h2>
          {cutProjection.winner ? (
            <p className="rounded border bg-neutral-50 p-4">
              Va ganando: <strong>{cutProjection.winner.teamName}</strong> ({cutProjection.winner.total} pts)
              {cutProjection.tied ? " — definido por la tabla general" : ""}
            </p>
          ) : (
            <p className="text-neutral-500">Sin datos suficientes.</p>
          )}
          <StandingsTable rows={cutProjection.rows} />
        </section>
      ) : null}
    </div>
  );
}