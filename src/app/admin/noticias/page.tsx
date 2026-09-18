import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function PostsPage() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Noticias</h1>
        <Link href="/admin/noticias/nueva" className="rounded bg-black px-3 py-2 text-sm text-white">
          Nueva noticia
        </Link>
      </div>
      <ul className="divide-y rounded border">
        {posts.map((post) => (
          <li key={post.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{post.title}</p>
              <p className="text-xs text-neutral-500">
                {post.category} · {post.published ? "Publicada" : "Borrador"}
              </p>
            </div>
            <Link href={`/admin/noticias/${post.id}`} className="text-sm underline">Editar</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
