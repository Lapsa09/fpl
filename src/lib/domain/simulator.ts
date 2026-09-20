import { computeStandings } from "./standings";
import type { MatchdayData, PointsRow, StandingRow, TeamRef } from "./types";

export type EstimateData = { matchdayId: string; points: PointsRow[] };

export function projectStandings(
  teams: TeamRef[],
  realMatchdays: MatchdayData[],
  estimates: EstimateData[],
): StandingRow[] {
  const withRealPoints = new Set(
    realMatchdays.filter((m) => m.points.length > 0).map((m) => m.id),
  );
  const estimateMatchdays: MatchdayData[] = estimates
    .filter((e) => !withRealPoints.has(e.matchdayId))
    .map((e) => ({ id: `estimate:${e.matchdayId}`, played: true, points: e.points }));
  return computeStandings(teams, [...realMatchdays, ...estimateMatchdays]);
}
