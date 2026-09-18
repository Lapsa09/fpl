import { prisma } from "@/lib/db";
import { EstimateForm } from "./EstimateForm";

export default async function SimulatorAdminPage() {
  const [matchdays, teams] = await Promise.all([
    prisma.matchday.findMany({
      where: { played: false },
      orderBy: { number: "asc" },
      include: { estimates: true, cut: true },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Simulador</h1>
      <p className="text-sm text-neutral-600">
        Cargá puntos estimados para las jornadas no jugadas. No afectan la tabla real.
      </p>
      {matchdays.length === 0 ? (
        <p className="text-neutral-500">No hay jornadas pendientes.</p>
      ) : (
        matchdays.map((matchday) => (
          <div key={matchday.id} className="rounded border p-4">
            <h2 className="mb-3 font-semibold">
              Jornada {matchday.number}
              {matchday.cut ? ` · ${matchday.cut.name}` : ""}
            </h2>
            <EstimateForm
              matchdayId={matchday.id}
              teams={teams.map((t) => ({ id: t.id, name: t.name }))}
              initial={Object.fromEntries(matchday.estimates.map((e) => [e.teamId, e.points]))}
            />
          </div>
        ))
      )}
    </div>
  );
}