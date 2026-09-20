import { prisma } from "@/lib/db";
import { createTeam, deleteTeam, updateTeam } from "./actions";
import {
  AdminCard,
  AdminGhostButton,
  AdminPrimaryButton,
  adminInputClassName,
  adminLabelClassName,
} from "@/components/admin/ui";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Equipos</h1>
        <p className="mt-1 text-sm text-muted">Los equipos que compiten en la tabla anual.</p>
      </div>

      <AdminCard>
        <form action={createTeam} className="flex flex-wrap items-end gap-3">
          <label className={adminLabelClassName}>
            Nombre
            <input name="name" required placeholder="Guinnes SCA United" className={adminInputClassName} />
          </label>
          <label className={adminLabelClassName}>
            Manager
            <input name="manager" required placeholder="Tomás" className={adminInputClassName} />
          </label>
          <AdminPrimaryButton>Agregar</AdminPrimaryButton>
        </form>
      </AdminCard>

      <ul className="divide-y divide-white/10 rounded-2xl border border-line bg-panel">
        {teams.map((team) => (
          <li key={team.id} className="flex flex-wrap items-center gap-3 p-4">
            <form action={updateTeam} className="flex flex-1 flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={team.id} />
              <input name="name" defaultValue={team.name} aria-label="Nombre del equipo" className={adminInputClassName} />
              <input name="manager" defaultValue={team.manager} aria-label="Manager" className={adminInputClassName} />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name="active" defaultChecked={team.active} className="h-4 w-4 accent-accent" /> Activo
              </label>
              <AdminGhostButton>Guardar</AdminGhostButton>
            </form>
            <form action={deleteTeam}>
              <input type="hidden" name="id" value={team.id} />
              <button className="text-sm text-danger">Eliminar</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
