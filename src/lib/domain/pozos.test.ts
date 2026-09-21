import { describe, expect, it } from "vitest";
import { cutPotBreakdown } from "./pozos";

describe("cutPotBreakdown", () => {
  it("10 participantes aportan 180000 en 9 cuotas de 20000", () => {
    expect(cutPotBreakdown(180000, 10)).toEqual({ potAmount: 180000, contributors: 9, quota: 20000 });
  });
  it("pot 0", () => {
    expect(cutPotBreakdown(0, 10)).toEqual({ potAmount: 0, contributors: 9, quota: 0 });
  });
  it("1 solo participante -> sin aportantes", () => {
    expect(cutPotBreakdown(180000, 1)).toEqual({ potAmount: 180000, contributors: 0, quota: 0 });
  });
  it("valores negativos se sanean a 0", () => {
    expect(cutPotBreakdown(-100, -3)).toEqual({ potAmount: 0, contributors: 0, quota: 0 });
  });
  it("trunca decimales", () => {
    expect(cutPotBreakdown(180000.9, 10.9)).toEqual({ potAmount: 180000, contributors: 9, quota: 20000 });
  });
  it("2 participantes -> 1 aportante con cuota del pozo completo", () => {
    expect(cutPotBreakdown(180000, 2)).toEqual({ potAmount: 180000, contributors: 1, quota: 180000 });
  });
  it("pot 100000 y 9 aportantes no divisibles trunca la cuota", () => {
    expect(cutPotBreakdown(100000, 10)).toEqual({ potAmount: 100000, contributors: 9, quota: 11111 });
  });
});
