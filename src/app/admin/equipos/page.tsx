import { prisma } from "@/lib/db";
import { createTeam, deleteTeam, updateTeam } from "./actions";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Equipos</h1>

      <form action={createTeam} className="flex flex-wrap items-end gap-3 rounded border p-4">
        <label className="flex flex-col text-sm">
          Nombre
          <input name="name" required className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Manager
          <input name="manager" required className="rounded border px-2 py-1" />
        </label>
        <button className="rounded bg-black px-3 py-2 text-sm text-white">Agregar</button>
      </form>

      <ul className="divide-y rounded border">
        {teams.map((team) => (
          <li key={team.id} className="flex items-center gap-3 p-3">
            <form action={updateTeam} className="flex flex-1 items-center gap-3">
              <input type="hidden" name="id" value={team.id} />
              <input name="name" defaultValue={team.name} className="rounded border px-2 py-1" />
              <input name="manager" defaultValue={team.manager} className="rounded border px-2 py-1" />
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" name="active" defaultChecked={team.active} /> Activo
              </label>
              <button className="rounded bg-neutral-200 px-3 py-1 text-sm">Guardar</button>
            </form>
            <form action={deleteTeam}>
              <input type="hidden" name="id" value={team.id} />
              <button className="text-sm text-red-600">Eliminar</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
