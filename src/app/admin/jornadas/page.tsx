import { prisma } from "@/lib/db";
import { createMatchday, togglePlayed } from "./actions";
import { PointsForm } from "./PointsForm";
import { MatchdayCard } from "./MatchdayCard";
import {
  AdminCard,
  AdminGhostButton,
  AdminPrimaryButton,
  adminInputClassName,
  adminLabelClassName,
} from "@/components/admin/ui";

export default async function MatchdaysPage() {
  const [matchdays, teams] = await Promise.all([
    prisma.matchday.findMany({ orderBy: { number: "desc" }, include: { points: true, cut: true } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Jornadas</h1>
        <p className="mt-1 text-sm text-muted">Solo las jornadas jugadas suman en la tabla.</p>
      </div>

      <AdminCard>
        <form action={createMatchday} className="flex flex-wrap items-end gap-3">
          <label className={adminLabelClassName}>
            Número de jornada
            <input name="number" type="number" min={1} required className={`w-24 ${adminInputClassName}`} />
          </label>
          <AdminPrimaryButton>Crear</AdminPrimaryButton>
        </form>
      </AdminCard>

      {matchdays.map((matchday, index) => (
        <MatchdayCard
          key={matchday.id}
          title={`Jornada ${matchday.number}`}
          meta={`${matchday.cut ? matchday.cut.name : "Sin corte"}${matchday.played ? " · jugada" : " · pendiente"}`}
          defaultOpen={index === 0}
          actions={
            <form action={togglePlayed}>
              <input type="hidden" name="id" value={matchday.id} />
              <input type="hidden" name="played" value={String(!matchday.played)} />
              <AdminGhostButton>
                {matchday.played ? "Marcar como no jugada" : "Marcar como jugada"}
              </AdminGhostButton>
            </form>
          }
        >
          <PointsForm
            matchdayId={matchday.id}
            teams={teams.map((t) => ({ id: t.id, name: t.name }))}
            initial={Object.fromEntries(matchday.points.map((p) => [p.teamId, p.points]))}
          />
        </MatchdayCard>
      ))}
    </div>
  );
}
