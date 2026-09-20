import { prisma } from "@/lib/db";
import { EstimateForm } from "./EstimateForm";
import { AdminCard } from "@/components/admin/ui";

export default async function SimulatorAdminPage() {
  const [matchdays, teams] = await Promise.all([
    prisma.matchday.findMany({
      orderBy: { number: "asc" },
      include: { estimates: true, cut: true, points: { select: { id: true } } },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);
  const pending = matchdays.filter((matchday) => matchday.points.length === 0);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Simulador</h1>
        <p className="mt-1 text-sm text-muted">
          Cargá puntos estimados para las jornadas sin puntos reales. No afectan la tabla real.
        </p>
      </div>
      {pending.length === 0 ? (
        <p className="text-sm text-muted">No hay jornadas para estimar.</p>
      ) : (
        pending.map((matchday) => (
          <AdminCard key={matchday.id}>
            <h2 className="mb-4 font-semibold">
              Jornada {matchday.number}
              {matchday.cut ? <span className="ml-2 text-sm font-normal text-muted">{matchday.cut.name}</span> : null}
            </h2>
            <EstimateForm
              matchdayId={matchday.id}
              teams={teams.map((t) => ({ id: t.id, name: t.name }))}
              initial={Object.fromEntries(matchday.estimates.map((e) => [e.teamId, e.points]))}
            />
          </AdminCard>
        ))
      )}
    </div>
  );
}
