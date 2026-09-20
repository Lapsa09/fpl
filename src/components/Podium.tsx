import Link from "next/link";
import type { StandingRow } from "@/lib/domain/types";

export function Podium({ rows }: { rows: StandingRow[] }) {
  const top = rows.slice(0, 3);
  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-black uppercase tracking-tight">Top 3</h2>
        <Link href="/tabla" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
          Tabla completa
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Sin datos todavía.</p>
      ) : (
        <div className="mt-4 divide-y divide-white/10">
          {top.map((row) => (
            <div key={row.teamId} className="flex items-center gap-4 py-4">
              <span
                className={
                  row.rank === 1
                    ? "grid h-9 w-9 shrink-0 place-items-center rounded-md bg-prize font-mono font-semibold text-[#06240f]"
                    : row.rank === 2
                      ? "grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent font-mono font-semibold text-accent-ink"
                      : row.rank === 3
                        ? "grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gold font-mono font-semibold text-[#2b1a00]"
                        : "shrink-0 font-mono text-lg text-muted"
                }
              >
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className={row.rank === 1 ? "font-bold truncate" : "font-semibold truncate"}>{row.teamName}</p>
                <p className="truncate text-xs text-muted">{row.manager}</p>
              </div>
              <p className={`font-mono text-2xl font-bold tabular-nums ${row.rank === 1 ? "text-accent" : ""}`}>
                {row.total}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}