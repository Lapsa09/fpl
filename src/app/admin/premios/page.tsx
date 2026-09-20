import { prisma } from "@/lib/db";
import { DEFAULT_PRIZES, PRIZE_TONES, rangeLabel } from "@/lib/domain/prizes";
import type { PrizeTone } from "@/lib/domain/prizes";
import { createPrizeRule, deletePrizeRule, updatePrizeRule } from "./actions";
import {
  AdminCard,
  AdminGhostButton,
  AdminPrimaryButton,
  adminInputClassName,
  adminLabelClassName,
} from "@/components/admin/ui";

const TONE_LABELS: Record<PrizeTone, string> = {
  green: "Verde",
  cyan: "Celeste",
  gold: "Dorado",
  steel: "Gris",
  red: "Rojo",
};

export default async function PrizesPage() {
  let stored;
  try {
    stored = await prisma.prizeRule.findMany({ orderBy: { fromRank: "asc" } });
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Premios y castigos</h1>
        <p className="text-sm text-muted">
          La tabla de premios todavía no existe en la base de datos. Aplicá el schema con{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px]">npx prisma db push</code>{" "}
          y volvé a cargar esta página.
        </p>
      </div>
    );
  }
  const showingDefaults = stored.length === 0;
  const rules = showingDefaults
    ? DEFAULT_PRIZES.map((rule, i) => ({ ...rule, id: `default-${i}`, createdAt: new Date() }))
    : stored;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Premios y castigos</h1>
        <p className="mt-1 text-sm text-muted">
          Qué se lleva cada puesto de la tabla anual. El color tiñe la columna de puestos y la leyenda.
        </p>
      </div>

      <AdminCard>
        <form action={createPrizeRule} className="flex flex-wrap items-end gap-3">
          <label className={adminLabelClassName}>
            Desde
            <input name="fromRank" type="number" min={1} defaultValue={1} required className={`w-20 ${adminInputClassName}`} />
          </label>
          <label className={adminLabelClassName}>
            Hasta
            <input name="toRank" type="number" min={1} defaultValue={1} required className={`w-20 ${adminInputClassName}`} />
          </label>
          <label className={`${adminLabelClassName} min-w-52 flex-1`}>
            Premio o castigo
            <input name="text" required placeholder="Gana camiseta" className={adminInputClassName} />
          </label>
          <label className={adminLabelClassName}>
            Color
            <select name="tone" defaultValue="steel" className={adminInputClassName}>
              {PRIZE_TONES.map((tone) => (
                <option key={tone} value={tone}>{TONE_LABELS[tone]}</option>
              ))}
            </select>
          </label>
          <AdminPrimaryButton>Agregar</AdminPrimaryButton>
        </form>
      </AdminCard>

      <ul className="space-y-3">
        {showingDefaults && (
          <p className="text-sm text-muted">
            Todavía no guardaste reglas: se muestran los valores iniciales. Agregá la primera para reemplazarlos.
          </p>
        )}
        {rules.map((rule) => (
          <AdminCard key={rule.id}>
            <p className="mb-3 text-sm font-bold">{rangeLabel(rule.fromRank, rule.toRank)}</p>
            {showingDefaults ? (
              <p className="text-sm text-muted">{rule.text}</p>
            ) : (
              <>
                <form action={updatePrizeRule} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={rule.id} />
                  <label className={adminLabelClassName}>
                    Desde
                    <input name="fromRank" type="number" min={1} defaultValue={rule.fromRank} required className={`w-20 ${adminInputClassName}`} />
                  </label>
                  <label className={adminLabelClassName}>
                    Hasta
                    <input name="toRank" type="number" min={1} defaultValue={rule.toRank} required className={`w-20 ${adminInputClassName}`} />
                  </label>
                  <label className={`${adminLabelClassName} min-w-52 flex-1`}>
                    Premio o castigo
                    <input name="text" defaultValue={rule.text} required className={adminInputClassName} />
                  </label>
                  <label className={adminLabelClassName}>
                    Color
                    <select name="tone" defaultValue={rule.tone} className={adminInputClassName}>
                      {PRIZE_TONES.map((tone) => (
                        <option key={tone} value={tone}>{TONE_LABELS[tone]}</option>
                      ))}
                    </select>
                  </label>
                  <AdminGhostButton>Guardar</AdminGhostButton>
                </form>
                <form action={deletePrizeRule} className="mt-2">
                  <input type="hidden" name="id" value={rule.id} />
                  <button className="text-sm text-danger">Eliminar</button>
                </form>
              </>
            )}
          </AdminCard>
        ))}
      </ul>
    </div>
  );
}
