import { prisma } from "@/lib/db";
import { assignMatchdayToCut, createCut, toggleCutClosed } from "./actions";

export default async function CutsPage() {
  const [cuts, matchdays] = await Promise.all([
    prisma.cut.findMany({ orderBy: { order: "asc" } }),
    prisma.matchday.findMany({ orderBy: { number: "asc" }, include: { cut: true } }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Cortes</h1>

      <form action={createCut} className="flex items-end gap-3 rounded border p-4">
        <label className="flex flex-col text-sm">
          Nombre
          <input name="name" required placeholder="Corte 1" className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Orden
          <input name="order" type="number" defaultValue={0} className="w-20 rounded border px-2 py-1" />
        </label>
        <button className="rounded bg-black px-3 py-2 text-sm text-white">Crear</button>
      </form>

      <div className="space-y-3">
        {cuts.map((cut) => (
          <div key={cut.id} className="flex items-center justify-between rounded border p-3">
            <span className="font-medium">{cut.name}</span>
            <form action={toggleCutClosed}>
              <input type="hidden" name="id" value={cut.id} />
              <input type="hidden" name="closed" value={String(!cut.closed)} />
              <button className="rounded bg-neutral-200 px-3 py-1 text-sm">
                {cut.closed ? "Reabrir" : "Cerrar corte"}
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="rounded border p-4">
        <h2 className="mb-3 font-semibold">Asignar jornadas a cortes</h2>
        <ul className="space-y-2">
          {matchdays.map((matchday) => (
            <li key={matchday.id}>
              <form action={assignMatchdayToCut} className="flex items-center gap-3 text-sm">
                <input type="hidden" name="matchdayId" value={matchday.id} />
                <span className="w-28">Jornada {matchday.number}</span>
                <select name="cutId" defaultValue={matchday.cutId ?? ""} className="rounded border px-2 py-1">
                  <option value="">Sin corte</option>
                  {cuts.map((cut) => (
                    <option key={cut.id} value={cut.id}>{cut.name}</option>
                  ))}
                </select>
                <button className="rounded bg-neutral-200 px-3 py-1">Asignar</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
