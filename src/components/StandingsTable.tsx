import type { StandingRow } from "@/lib/domain/types";
import { DEFAULT_PRIZES, rangeLabel, toneForRank } from "@/lib/domain/prizes";
import type { PrizeRule, PrizeTone } from "@/lib/domain/prizes";

const CELL_TONES: Record<PrizeTone, string> = {
  green: "bg-prize text-[#06240f]",
  cyan: "bg-accent text-accent-ink",
  gold: "bg-gold text-[#2b1a00]",
  steel: "bg-steel/90 text-[#241b33]",
  red: "bg-danger text-white",
};

const DOT_TONES: Record<PrizeTone, string> = {
  green: "bg-prize",
  cyan: "bg-accent",
  gold: "bg-gold",
  steel: "bg-steel",
  red: "bg-danger",
};

function effectivePrizes(prizes?: PrizeRule[]): PrizeRule[] {
  return prizes && prizes.length > 0 ? prizes : DEFAULT_PRIZES;
}

export function StandingsTable({
  rows,
  title,
  prizes,
}: {
  rows: StandingRow[];
  title?: string;
  prizes?: PrizeRule[];
}) {
  const rules = effectivePrizes(prizes);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]">
      {title ? (
        <p className="border-b border-line px-5 py-3 text-lg font-black uppercase tracking-tight md:text-xl">
          {title}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-sm text-muted">
              <th scope="col" className="w-14 py-3 pl-4 pr-2 font-medium">
                <span className="sr-only">Puesto</span>
                <span aria-hidden="true">#</span>
              </th>
              <th scope="col" className="py-3 pr-2 font-medium">
                Equipos
              </th>
              <th
                scope="col"
                className="border-l border-line/70 py-3 pl-2 pr-4 text-center font-medium"
              >
                GW
              </th>
              <th
                scope="col"
                className="border-l border-line/70 py-3 pl-2 pr-5 text-center font-medium"
              >
                TOT
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.teamId}
                className={i % 2 === 1 ? "bg-white/3" : undefined}
              >
                <td
                  className={`px-2 py-1.5 text-center text-2xl font-black tabular-nums ${CELL_TONES[toneForRank(rules, row.rank)]}`}
                >
                  {row.rank}
                </td>
                <td className="border-t border-white/10 py-3 pl-4 pr-2">
                  <span className="font-bold leading-tight">
                    {row.teamName}
                  </span>
                  <span className="block text-sm leading-tight text-muted">
                    {row.manager}
                  </span>
                </td>
                <td className="border-l border-t border-white/10 py-3 pl-2 pr-4 text-center font-mono text-lg tabular-nums">
                  {row.played}
                </td>
                <td className="border-l border-t border-white/10 py-3 pl-2 pr-5 text-center font-mono text-lg font-semibold tabular-nums">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PrizeLegend({ prizes }: { prizes?: PrizeRule[] }) {
  const rules = effectivePrizes(prizes);
  return (
    <div className="rounded-2xl border border-line bg-panel px-5 py-2">
      <ul className="divide-y divide-white/10">
        {rules.map((prize) => (
          <li
            key={`${prize.fromRank}-${prize.toRank}-${prize.text}`}
            className="flex items-center gap-4 py-2.5"
          >
            <span
              aria-hidden="true"
              className={`h-6 w-6 shrink-0 rounded-full ${DOT_TONES[prize.tone]}`}
            />
            <p className="text-[15px]">
              <strong className="font-bold">
                {rangeLabel(prize.fromRank, prize.toRank)}:
              </strong>{" "}
              <span className="text-white/90">{prize.text}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
