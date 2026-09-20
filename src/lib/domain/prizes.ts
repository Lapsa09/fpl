export type PrizeTone = "green" | "cyan" | "gold" | "steel" | "red";

export const PRIZE_TONES: PrizeTone[] = ["green", "cyan", "gold", "steel", "red"];

export interface PrizeRule {
  fromRank: number;
  toRank: number;
  text: string;
  tone: PrizeTone;
}

export const DEFAULT_PRIZES: PrizeRule[] = [
  { fromRank: 1, toRank: 1, text: "Campeón, gana camiseta", tone: "green" },
  { fromRank: 2, toRank: 2, text: "Gana short", tone: "cyan" },
  { fromRank: 3, toRank: 3, text: "No paga nada", tone: "gold" },
  { fromRank: 4, toRank: 8, text: "Pagan los premios", tone: "steel" },
  { fromRank: 9, toRank: 9, text: "Paga bebidas para todos", tone: "red" },
  { fromRank: 10, toRank: 10, text: "Paga asado para todos", tone: "red" },
];

export function isPrizeTone(value: string): value is PrizeTone {
  return (PRIZE_TONES as string[]).includes(value);
}

/** Abreviatura ordinal en español: 1ro, 2do, 3ro, 4to, 7mo, 8vo, 9no, 10mo. */
export function ordinalEs(n: number): string {
  const last = Math.abs(n) % 10;
  const lastTwo = Math.abs(n) % 100;
  if (lastTwo === 11 || lastTwo === 12) return `${n}mo`;
  switch (last) {
    case 1:
    case 3:
      return `${n}ro`;
    case 2:
      return `${n}do`;
    case 4:
    case 5:
    case 6:
      return `${n}to`;
    case 7:
    case 0:
      return `${n}mo`;
    case 8:
      return `${n}vo`;
    default:
      return `${n}no`;
  }
}

/** Etiqueta de rango: "1ro" para un puesto, "4to a 8vo" para un tramo. */
export function rangeLabel(fromRank: number, toRank: number): string {
  if (fromRank === toRank) return ordinalEs(fromRank);
  return `${ordinalEs(fromRank)} a ${ordinalEs(toRank)}`;
}

/** Tono de la primera regla que contiene el puesto; "steel" si ninguna lo cubre. */
export function toneForRank(rules: PrizeRule[], rank: number): PrizeTone {
  const match = rules.find((rule) => rank >= rule.fromRank && rank <= rule.toRank);
  return match?.tone ?? "steel";
}

export function sortPrizeRules(rules: PrizeRule[]): PrizeRule[] {
  return [...rules].sort((a, b) => a.fromRank - b.fromRank || a.toRank - b.toRank);
}
