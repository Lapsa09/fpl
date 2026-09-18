import { describe, expect, it } from "vitest";
import { projectStandings } from "./simulator";
import type { MatchdayData, TeamRef } from "./types";

const teams: TeamRef[] = [
  { id: "a", name: "Alpha", manager: "Ana" },
  { id: "b", name: "Beta", manager: "Beto" },
];

describe("projectStandings", () => {
  it("suma puntos reales más estimaciones", () => {
    const real: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 50 }, { teamId: "b", points: 40 }] },
      { id: "2", played: false, points: [] },
    ];
    const estimates = [
      { matchdayId: "2", points: [{ teamId: "a", points: 30 }, { teamId: "b", points: 60 }] },
    ];
    const rows = projectStandings(teams, real, estimates);
    expect(rows.map((r) => [r.teamName, r.total])).toEqual([["Beta", 100], ["Alpha", 80]]);
  });

  it("sin estimaciones proyecta solo lo real", () => {
    const real: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 10 }] },
    ];
    const rows = projectStandings(teams, real, []);
    expect(rows.find((r) => r.teamId === "a")!.total).toBe(10);
    expect(rows.find((r) => r.teamId === "b")!.total).toBe(0);
  });

  it("ignora estimaciones de jornadas ya jugadas", () => {
    const real: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 10 }] },
    ];
    const estimates = [{ matchdayId: "1", points: [{ teamId: "a", points: 999 }] }];
    const rows = projectStandings(teams, real, estimates);
    expect(rows.find((r) => r.teamId === "a")!.total).toBe(10);
  });
});
