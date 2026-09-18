import { computeStandings } from "./standings";
import type { MatchdayData, StandingRow, TeamRef } from "./types";

export type MatchdayInCut = MatchdayData & { cutId: string | null };

export function standingsForCut(
  teams: TeamRef[],
  matchdays: MatchdayInCut[],
  cutId: string,
): StandingRow[] {
  return computeStandings(
    teams,
    matchdays.filter((m) => m.cutId === cutId),
  );
}

export function resolveCutWinner(
  cutRows: StandingRow[],
  generalRows: StandingRow[],
): { winner: StandingRow | null; tied: boolean } {
  if (cutRows.length === 0) return { winner: null, tied: false };
  const max = Math.max(...cutRows.map((r) => r.total));
  const leaders = cutRows.filter((r) => r.total === max);
  const generalRank = new Map(generalRows.map((r) => [r.teamId, r.rank]));
  const winner = [...leaders].sort(
    (a, b) => (generalRank.get(a.teamId) ?? 999) - (generalRank.get(b.teamId) ?? 999),
  )[0];
  return { winner, tied: leaders.length > 1 };
}
