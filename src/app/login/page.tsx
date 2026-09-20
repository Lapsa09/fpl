"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { AdminCard, adminInputClassName } from "@/components/admin/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { error: undefined as string | undefined });
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <AdminCard className="p-6">
        <p className="text-base font-black uppercase tracking-tight">
          Premier <span className="text-accent">Arg</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold">Panel de administración</h1>
        <form action={action} className="mt-6 space-y-4">
          <input
            name="password"
            type="password"
            required
            placeholder="Contraseña"
            aria-label="Contraseña"
            className={`w-full ${adminInputClassName}`}
          />
          {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent px-3 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50"
          >
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </AdminCard>
    </main>
  );
}
