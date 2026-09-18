import { describe, expect, it } from "vitest";
import { resolveCutWinner, standingsForCut } from "./cuts";
import type { MatchdayInCut } from "./cuts";
import type { StandingRow, TeamRef } from "./types";

const teams: TeamRef[] = [
  { id: "a", name: "Alpha", manager: "Ana" },
  { id: "b", name: "Beta", manager: "Beto" },
];

describe("resolveCutWinner", () => {
  const general: StandingRow[] = [
    { teamId: "a", teamName: "Alpha", manager: "Ana", played: 4, total: 300, rank: 1 },
    { teamId: "b", teamName: "Beta", manager: "Beto", played: 4, total: 280, rank: 2 },
  ];
  const cut: StandingRow[] = [
    { teamId: "b", teamName: "Beta", manager: "Beto", played: 4, total: 121, rank: 1 },
    { teamId: "a", teamName: "Alpha", manager: "Ana", played: 4, total: 110, rank: 2 },
  ];

  it("elige al de mayor total en el corte", () => {
    expect(resolveCutWinner(cut, general).winner?.teamId).toBe("b");
  });

  it("desempata por la tabla general", () => {
    const tied = cut.map((r) => ({ ...r, total: 110 }));
    const result = resolveCutWinner(tied, general);
    expect(result.tied).toBe(true);
    expect(result.winner?.teamId).toBe("a");
  });

  it("devuelve null si no hay filas", () => {
    expect(resolveCutWinner([], general).winner).toBeNull();
  });
});

describe("standingsForCut", () => {
  it("solo suma jornadas del corte indicado", () => {
    const matchdays: MatchdayInCut[] = [
      { id: "1", played: true, cutId: "c1", points: [{ teamId: "a", points: 10 }] },
      { id: "2", played: true, cutId: "c2", points: [{ teamId: "a", points: 50 }] },
    ];
    const rows = standingsForCut(teams, matchdays, "c1");
    expect(rows.find((r) => r.teamId === "a")!.total).toBe(10);
  });
});