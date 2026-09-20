import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { AdminNav } from "@/components/admin/AdminNav";

export async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySession(token)) redirect("/login");
}

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 md:flex-row md:gap-8">
      <aside className="shrink-0 rounded-2xl border border-line bg-panel p-3 md:w-48 md:self-start lg:sticky lg:top-24">
        <Link href="/admin" className="mb-2 block px-3 py-1 text-base font-black uppercase tracking-tight">
          Premier <span className="text-accent">Arg</span>
        </Link>
        <AdminNav />
        <form action={logout} className="mt-4 border-t border-white/10 px-3 pt-3">
          <button className="text-sm text-danger">Cerrar sesión</button>
        </form>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
