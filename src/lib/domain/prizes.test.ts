import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRIZES,
  ordinalEs,
  rangeLabel,
  sortPrizeRules,
  toneForRank,
} from "./prizes";

describe("ordinalEs", () => {
  it("abrevia los ordinales del 1 al 10", () => {
    expect(["1ro", "2do", "3ro", "4to", "5to", "6to", "7mo", "8vo", "9no", "10mo"])
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(ordinalEs));
  });
});

describe("rangeLabel", () => {
  it("usa un solo ordinal para un puesto", () => {
    expect(rangeLabel(1, 1)).toBe("1ro");
  });

  it("une el tramo con 'a'", () => {
    expect(rangeLabel(4, 8)).toBe("4to a 8vo");
  });
});

describe("toneForRank", () => {
  it("devuelve el tono de la regla que cubre el puesto", () => {
    expect(toneForRank(DEFAULT_PRIZES, 1)).toBe("green");
    expect(toneForRank(DEFAULT_PRIZES, 2)).toBe("cyan");
    expect(toneForRank(DEFAULT_PRIZES, 3)).toBe("gold");
    expect(toneForRank(DEFAULT_PRIZES, 6)).toBe("steel");
    expect(toneForRank(DEFAULT_PRIZES, 9)).toBe("red");
  });

  it("devuelve steel si ninguna regla cubre el puesto", () => {
    expect(toneForRank([], 5)).toBe("steel");
    expect(toneForRank(DEFAULT_PRIZES, 11)).toBe("steel");
  });

  it("gana la primera regla en caso de solapamiento", () => {
    expect(
      toneForRank(
        [
          { fromRank: 1, toRank: 5, text: "A", tone: "gold" },
          { fromRank: 3, toRank: 10, text: "B", tone: "red" },
        ],
        4,
      ),
    ).toBe("gold");
  });
});

describe("sortPrizeRules", () => {
  it("ordena por puesto inicial", () => {
    const sorted = sortPrizeRules([DEFAULT_PRIZES[3], DEFAULT_PRIZES[0]]);
    expect(sorted[0].fromRank).toBe(1);
    expect(sorted[1].fromRank).toBe(4);
  });
});
