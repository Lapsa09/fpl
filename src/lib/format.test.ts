import { expect, it } from "vitest";
import { formatMoney } from "./format";

it("180000 -> $180.000", () => expect(formatMoney(180000)).toBe("$180.000"));
it("20000 -> $20.000", () => expect(formatMoney(20000)).toBe("$20.000"));
it("0 -> $0", () => expect(formatMoney(0)).toBe("$0"));
it("negativo y decimal se sanean", () => expect(formatMoney(-12.9)).toBe("$0"));