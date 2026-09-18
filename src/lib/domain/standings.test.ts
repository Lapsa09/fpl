import { describe, expect, it } from "vitest";
import { computeStandings } from "./standings";
import type { MatchdayData, TeamRef } from "./types";

const teams: TeamRef[] = [
  { id: "a", name: "Alpha", manager: "Ana" },
  { id: "b", name: "Beta", manager: "Beto" },
  { id: "c", name: "Gamma", manager: "Caro" },
];

describe("computeStandings", () => {
  it("suma puntos por equipo y ordena descendente", () => {
    const matchdays: MatchdayData[] = [
      { id: "1", played: true, points: [
        { teamId: "a", points: 70 }, { teamId: "b", points: 55 }, { teamId: "c", points: 61 },
      ]},
      { id: "2", played: true, points: [
        { teamId: "a", points: 40 }, { teamId: "b", points: 66 }, { teamId: "c", points: 50 },
      ]},
    ];
    const rows = computeStandings(teams, matchdays);
    expect(rows.map((r) => [r.teamName, r.total, r.rank])).toEqual([
      ["Beta", 121, 1],
      ["Gamma", 111, 2],
      ["Alpha", 110, 3],
    ]);
  });

  it("cuenta jornadas jugadas solo si el equipo tiene fila de puntos", () => {
    const matchdays: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 10 }] },
    ];
    const rows = computeStandings(teams, matchdays);
    const a = rows.find((r) => r.teamId === "a")!;
    const b = rows.find((r) => r.teamId === "b")!;
    expect(a.played).toBe(1);
    expect(b.played).toBe(0);
    expect(b.total).toBe(0);
  });

  it("desempata por nombre ascendente", () => {
    const matchdays: MatchdayData[] = [
      { id: "1", played: true, points: [
        { teamId: "a", points: 10 }, { teamId: "b", points: 10 }, { teamId: "c", points: 10 },
      ]},
    ];
    const rows = computeStandings(teams, matchdays);
    expect(rows.map((r) => r.teamName)).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("ignora jornadas no jugadas", () => {
    const matchdays: MatchdayData[] = [
      { id: "1", played: true, points: [{ teamId: "a", points: 10 }] },
      { id: "2", played: false, points: [{ teamId: "a", points: 99 }] },
    ];
    const rows = computeStandings(teams, matchdays);
    expect(rows.find((r) => r.teamId === "a")!.total).toBe(10);
  });
});