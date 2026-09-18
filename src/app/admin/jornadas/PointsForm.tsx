"use client";

import { useState, useTransition } from "react";
import { savePoints } from "./actions";

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
      className="space-y-2"
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {teams.map((team) => (
          <label key={team.id} className="flex items-center justify-between gap-2 text-sm">
            {team.name}
            <input
              type="number"
              min={0}
              value={values[team.id]}
              onChange={(e) => setValues((v) => ({ ...v, [team.id]: e.target.value }))}
              className="w-20 rounded border px-2 py-1"
            />
          </label>
        ))}
      </div>
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50">
        {pending ? "Guardando…" : "Guardar puntos"}
      </button>
    </form>
  );
}