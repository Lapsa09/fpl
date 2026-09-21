import { prisma } from "@/lib/db";
import { assignMatchdayToCut, createCut, saveCutPot, toggleCutClosed } from "./actions";
import {
  AdminCard,
  AdminGhostButton,
  AdminPrimaryButton,
  adminInputClassName,
  adminLabelClassName,
} from "@/components/admin/ui";

export default async function CutsPage() {
  const [cuts, matchdays, settings] = await Promise.all([
    prisma.cut.findMany({ orderBy: { order: "asc" } }),
    prisma.matchday.findMany({ orderBy: { number: "asc" }, include: { cut: true } }),
    prisma.leagueSettings.findUnique({ where: { id: 1 } }),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Cortes</h1>
        <p className="mt-1 text-sm text-muted">Cada corte agrupa jornadas y tiene su propio ganador.</p>
      </div>

      <AdminCard>
        <form action={createCut} className="flex flex-wrap items-end gap-3">
          <label className={adminLabelClassName}>
            Nombre
            <input name="name" required placeholder="Corte 1" className={adminInputClassName} />
          </label>
          <label className={adminLabelClassName}>
            Orden
            <input name="order" type="number" defaultValue={0} className={`w-20 ${adminInputClassName}`} />
          </label>
          <AdminPrimaryButton>Crear</AdminPrimaryButton>
        </form>
      </AdminCard>

      <div className="space-y-3">
        {cuts.map((cut) => (
          <AdminCard key={cut.id} className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">
              {cut.name}
              <span className="ml-2 text-sm font-normal text-muted">{cut.closed ? "Cerrado" : "En juego"}</span>
            </span>
            <form action={toggleCutClosed}>
              <input type="hidden" name="id" value={cut.id} />
              <input type="hidden" name="closed" value={String(!cut.closed)} />
              <AdminGhostButton>{cut.closed ? "Reabrir" : "Cerrar corte"}</AdminGhostButton>
            </form>
          </AdminCard>
        ))}
      </div>

      <AdminCard>
        <h2 className="mb-3 font-semibold">Asignar jornadas a cortes</h2>
        <ul className="space-y-2">
          {matchdays.map((matchday) => (
            <li key={matchday.id}>
              <form action={assignMatchdayToCut} className="flex flex-wrap items-center gap-3 text-sm">
                <input type="hidden" name="matchdayId" value={matchday.id} />
                <span className="w-28">Jornada {matchday.number}</span>
                <select name="cutId" defaultValue={matchday.cutId ?? ""} className={adminInputClassName}>
                  <option value="">Sin corte</option>
                  {cuts.map((cut) => (
                    <option key={cut.id} value={cut.id}>{cut.name}</option>
                  ))}
                </select>
                <AdminGhostButton>Asignar</AdminGhostButton>
              </form>
            </li>
          ))}
        </ul>
      </AdminCard>

      <AdminCard>
        <form action={saveCutPot} className="flex flex-wrap items-end gap-3">
          <label className={adminLabelClassName}>
            Pozo del ganador del corte (ARS)
            <input
              name="cutPotAmount"
              type="number"
              min={0}
              required
              defaultValue={settings?.cutPotAmount ?? 180000}
              className={adminInputClassName}
            />
          </label>
          <AdminGhostButton>Guardar</AdminGhostButton>
        </form>
      </AdminCard>
    </div>
  );
}
