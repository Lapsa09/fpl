"use client";

import { useState, useTransition } from "react";
import { savePoints } from "./actions";
import { AdminPrimaryButton, adminInputClassName } from "@/components/admin/ui";

export function PointsForm({
  matchdayId,
  teams,
  initial,
}: {
  matchdayId: string;
  teams: { id: string; name: string }[];
  initial: Record<string, number>;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(teams.map((t) => [t.id, String(initial[t.id] ?? "")])),
  );
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const entries = Object.entries(values)
          .filter(([, v]) => v !== "" && !Number.isNaN(Number(v)))
          .map(([teamId, v]) => ({ teamId, points: Math.max(0, Math.trunc(Number(v))) }));
        startTransition(() => {
          void savePoints(matchdayId, entries);
        });
      }}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <label
            key={team.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-line/70 bg-background px-3 py-2 text-sm"
          >
            <span className="truncate">{team.name}</span>
            <input
              type="number"
              min={0}
              aria-label={`Puntos de ${team.name}`}
              value={values[team.id]}
              onChange={(e) => setValues((v) => ({ ...v, [team.id]: e.target.value }))}
              className={`w-20 ${adminInputClassName}`}
            />
          </label>
        ))}
      </div>
      <AdminPrimaryButton disabled={pending}>
        {pending ? "Guardando…" : "Guardar puntos"}
      </AdminPrimaryButton>
    </form>
  );
}
