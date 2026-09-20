import Link from "next/link";
import { prisma } from "@/lib/db";
import { categoryLabel } from "@/components/NewsCard";
import { adminPrimaryClassName } from "@/components/admin/ui";

export default async function PostsPage() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Noticias</h1>
          <p className="mt-1 text-sm text-muted">Comunicados visibles en la portada y la sección de noticias.</p>
        </div>
        <Link href="/admin/noticias/nueva" className={adminPrimaryClassName}>
          Nueva noticia
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay noticias.</p>
      ) : (
        <ul className="divide-y divide-white/10 rounded-2xl border border-line bg-panel">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{post.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {categoryLabel(post.category)} · {post.published ? "Publicada" : "Borrador"}
                </p>
              </div>
              <Link href={`/admin/noticias/${post.id}`} className="shrink-0 text-sm font-semibold text-accent hover:underline">
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
