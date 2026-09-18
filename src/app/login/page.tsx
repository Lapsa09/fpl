"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { error: undefined as string | undefined });
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-2xl font-bold">Panel de administración</h1>
      <form action={action} className="space-y-4">
        <input
          name="password"
          type="password"
          required
          placeholder="Contraseña"
          className="w-full rounded border px-3 py-2"
        />
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
