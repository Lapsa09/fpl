export type TeamRef = { id: string; name: string; manager: string };
export type PointsRow = { teamId: string; points: number };
export type MatchdayData = { id: string; played: boolean; points: PointsRow[] };
export type StandingRow = {
  teamId: string;
  teamName: string;
  manager: string;
  played: number;
  total: number;
  rank: number;
};
