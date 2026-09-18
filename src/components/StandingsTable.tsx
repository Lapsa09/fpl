import type { StandingRow } from "@/lib/domain/types";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left text-neutral-500">
          <th className="py-2 pr-2">#</th>
          <th className="py-2 pr-2">Equipo</th>
          <th className="py-2 pr-2">Manager</th>
          <th className="py-2 pr-2 text-right">PJ</th>
          <th className="py-2 text-right">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.teamId} className="border-b">
            <td className="py-2 pr-2 font-semibold">{row.rank}</td>
            <td className="py-2 pr-2">{row.teamName}</td>
            <td className="py-2 pr-2 text-neutral-600">{row.manager}</td>
            <td className="py-2 pr-2 text-right">{row.played}</td>
            <td className="py-2 text-right font-bold">{row.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}