import { describe, expect, it } from "vitest";
import { cutTitle, resolveCutWinner, standingsForCut } from "./cuts";
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

describe("cutTitle", () => {
  it("no duplica cuando el nombre ya es 'Corte N'", () => {
    expect(cutTitle(1, "Corte 1")).toBe("Corte 1");
  });

  it("detecta el prefijo sin importar mayúsculas", () => {
    expect(cutTitle(2, "corte 2")).toBe("corte 2");
  });

  it("preserva el nombre original al detectar el prefijo", () => {
    expect(cutTitle(3, "  Corte 3  ")).toBe("  Corte 3  ");
  });

  it("antepone el número de corte cuando el nombre no lo incluye", () => {
    expect(cutTitle(1, "Play-in")).toBe("Corte 1 — Play-in");
  });

  it("antepone el número de corte a otros nombres", () => {
    expect(cutTitle(2, "Fase final")).toBe("Corte 2 — Fase final");
  });
});
