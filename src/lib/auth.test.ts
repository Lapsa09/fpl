import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.ADMIN_PASSWORD = "secreto";
  process.env.AUTH_SECRET = "test-secret";
});

describe("auth", () => {
  it("valida la contraseña correcta e incorrecta", async () => {
    const { checkPassword } = await import("./auth");
    expect(checkPassword("secreto")).toBe(true);
    expect(checkPassword("otra")).toBe(false);
  });

  it("firma y verifica una sesión válida", async () => {
    const { signSession, verifySession } = await import("./auth");
    const token = signSession(Date.now() + 10000);
    expect(verifySession(token)).toBe(true);
  });

  it("rechaza una sesión expirada", async () => {
    const { signSession, verifySession } = await import("./auth");
    const token = signSession(Date.now() - 1000);
    expect(verifySession(token)).toBe(false);
  });

  it("rechaza una firma manipulada", async () => {
    const { signSession, verifySession } = await import("./auth");
    const token = signSession(Date.now() + 10000);
    expect(verifySession(token.slice(0, -1) + "0")).toBe(false);
  });

  it("rechaza token undefined", async () => {
    const { verifySession } = await import("./auth");
    expect(verifySession(undefined)).toBe(false);
  });
});