import { cache } from "react";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/domain/standings";
import { resolveCutWinner, standingsForCut } from "@/lib/domain/cuts";
import type { MatchdayInCut } from "@/lib/domain/cuts";
import { DEFAULT_PRIZES, isPrizeTone } from "@/lib/domain/prizes";
import type { PrizeRule } from "@/lib/domain/prizes";
import { projectStandings } from "@/lib/domain/simulator";
import type { EstimateData } from "@/lib/domain/simulator";
import { cutPotBreakdown } from "@/lib/domain/pozos";
import type { CutPot } from "@/lib/domain/pozos";
import type { MatchdayData, StandingRow, TeamRef } from "@/lib/domain/types";

export const getTeams = cache(async (): Promise<TeamRef[]> => {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  return teams.map((t) => ({ id: t.id, name: t.name, manager: t.manager }));
});

export const getMatchdaysWithCut = cache(async (): Promise<MatchdayInCut[]> => {
  const matchdays = await prisma.matchday.findMany({
    orderBy: { number: "asc" },
    include: { points: true },
  });
  return matchdays.map((m) => ({
    id: m.id,
    played: m.played,
    cutId: m.cutId,
    points: m.points.map((p) => ({ teamId: p.teamId, points: p.points })),
  }));
});

export const getMatchdays = cache(async (): Promise<MatchdayData[]> =>
  (await getMatchdaysWithCut()).map(({ id, played, points }) => ({ id, played, points })),
);

export const getCuts = cache(async () =>
  prisma.cut.findMany({
    orderBy: { order: "asc" },
    include: { matchdays: { orderBy: { number: "asc" }, select: { id: true } } },
  }).then((cuts) =>
    cuts.map((c) => ({
      id: c.id,
      name: c.name,
      order: c.order,
      closed: c.closed,
      matchdayIds: c.matchdays.map((m) => m.id),
    })),
  ),
);

export const getEstimates = cache(async (): Promise<EstimateData[]> => {
  const estimates = await prisma.estimate.findMany();
  const grouped = new Map<string, { teamId: string; points: number }[]>();
  for (const e of estimates) {
    const list = grouped.get(e.matchdayId) ?? [];
    list.push({ teamId: e.teamId, points: e.points });
    grouped.set(e.matchdayId, list);
  }
  return [...grouped.entries()].map(([matchdayId, points]) => ({ matchdayId, points }));
});

export const getGeneralStandings = cache(async (): Promise<StandingRow[]> =>
  computeStandings(await getTeams(), await getMatchdays()),
);

export const getPrizeRules = cache(async (): Promise<PrizeRule[]> => {
  try {
    const rows = await prisma.prizeRule.findMany({ orderBy: { fromRank: "asc" } });
    if (rows.length === 0) return DEFAULT_PRIZES;
    return rows.map((r) => ({
      fromRank: r.fromRank,
      toRank: r.toRank,
      text: r.text,
      tone: isPrizeTone(r.tone) ? r.tone : "steel",
    }));
  } catch {
    return DEFAULT_PRIZES;
  }
});

export const getProjectedStandings = cache(async (): Promise<StandingRow[]> =>
  projectStandings(await getTeams(), await getMatchdays(), await getEstimates()),
);

export async function getCutResult(cutId: string) {
  const teams = await getTeams();
  const matchdays = await getMatchdaysWithCut();
  const cuts = await getCuts();
  const cut = cuts.find((c) => c.id === cutId);
  if (!cut) return { cut: null, rows: [], winner: null, tied: false };
  const rows = standingsForCut(teams, matchdays, cutId);
  const { winner, tied } = resolveCutWinner(rows, await getGeneralStandings());
  return { cut, rows, winner, tied };
}

export async function getProjectedCutResult(cutId: string) {
  const teams = await getTeams();
  const cuts = await getCuts();
  const cut = cuts.find((c) => c.id === cutId);
  if (!cut) return { rows: [] as StandingRow[], winner: null, tied: false };
  const idSet = new Set(cut.matchdayIds);
  const matchdays = await getMatchdays();
  const estimates = await getEstimates();
  const rows = projectStandings(
    teams,
    matchdays.filter((m) => idSet.has(m.id)),
    estimates.filter((e) => idSet.has(e.matchdayId)),
  );
  const { winner, tied } = resolveCutWinner(rows, await getGeneralStandings());
  return { rows, winner, tied };
}

export const getCutPot = cache(async (): Promise<CutPot> => {
  const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });
  const participants = await prisma.team.count({ where: { active: true } });
  return cutPotBreakdown(settings?.cutPotAmount ?? 180000, participants);
});
