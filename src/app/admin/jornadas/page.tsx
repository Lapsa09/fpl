import { prisma } from "@/lib/db";
import { createMatchday, togglePlayed } from "./actions";
import { PointsForm } from "./PointsForm";

export default async function MatchdaysPage() {
  const [matchdays, teams] = await Promise.all([
    prisma.matchday.findMany({ orderBy: { number: "asc" }, include: { points: true, cut: true } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Jornadas</h1>

      <form action={createMatchday} className="flex items-end gap-3 rounded border p-4">
        <label className="flex flex-col text-sm">
          Número de jornada
          <input name="number" type="number" min={1} required className="rounded border px-2 py-1" />
        </label>
        <button className="rounded bg-black px-3 py-2 text-sm text-white">Crear</button>
      </form>

      {matchdays.map((matchday) => (
        <div key={matchday.id} className="rounded border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              Jornada {matchday.number}
              {matchday.cut ? ` · ${matchday.cut.name}` : " · sin corte"}
            </h2>
            <form action={togglePlayed}>
              <input type="hidden" name="id" value={matchday.id} />
              <input type="hidden" name="played" value={String(!matchday.played)} />
              <button className="rounded bg-neutral-200 px-3 py-1 text-sm">
                {matchday.played ? "Marcar como no jugada" : "Marcar como jugada"}
              </button>
            </form>
          </div>
          <PointsForm
            matchdayId={matchday.id}
            teams={teams.map((t) => ({ id: t.id, name: t.name }))}
            initial={Object.fromEntries(matchday.points.map((p) => [p.teamId, p.points]))}
          />
        </div>
      ))}
    </div>
  );
}