import type { MatchdayData, StandingRow, TeamRef } from "./types";

export function computeStandings(
  teams: TeamRef[],
  matchdays: MatchdayData[],
): StandingRow[] {
  const totals = new Map<string, { total: number; played: number }>();
  for (const team of teams) totals.set(team.id, { total: 0, played: 0 });

  for (const matchday of matchdays) {
    if (!matchday.played) continue;
    for (const row of matchday.points) {
      const entry = totals.get(row.teamId);
      if (!entry) continue;
      entry.total += row.points;
      entry.played += 1;
    }
  }

  const rows = teams.map((team) => {
    const entry = totals.get(team.id)!;
    return {
      teamId: team.id,
      teamName: team.name,
      manager: team.manager,
      played: entry.played,
      total: entry.total,
      rank: 0,
    };
  });

  rows.sort(
    (a, b) => b.total - a.total || a.teamName.localeCompare(b.teamName),
  );
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });
  return rows;
}