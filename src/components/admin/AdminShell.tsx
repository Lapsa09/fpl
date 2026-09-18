import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const links = [
  ["/admin", "Resumen"],
  ["/admin/equipos", "Equipos"],
  ["/admin/jornadas", "Jornadas"],
  ["/admin/cortes", "Cortes"],
  ["/admin/noticias", "Noticias"],
  ["/admin/simulador", "Simulador"],
] as const;

export async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySession(token)) redirect("/login");
}

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-5xl gap-8 px-6 py-10">
      <aside className="w-48 shrink-0">
        <nav className="space-y-2 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="block rounded px-2 py-1 hover:bg-neutral-100">
              {label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-8">
          <button className="text-sm text-red-600">Cerrar sesión</button>
        </form>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
