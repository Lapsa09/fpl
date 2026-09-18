import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("quita acentos y espacios", () => {
    expect(slugify("Traspaso bomba: ¡Mbappé al Real!")).toBe("traspaso-bomba-mbappe-al-real");
  });
  it("colapsa separadores repetidos", () => {
    expect(slugify("  hola ---  mundo  ")).toBe("hola-mundo");
  });
  it("devuelve cadena vacía si no hay caracteres válidos", () => {
    expect(slugify("¡!¿?")).toBe("");
  });
});
