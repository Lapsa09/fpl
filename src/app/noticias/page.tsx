import { prisma } from "@/lib/db";
import { NewsCard } from "@/components/NewsCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Noticias" };

export default async function NewsListPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });
  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">Comunicados</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">Noticias</h1>
      </header>
      {posts.length === 0 ? (
        <p className="text-muted">Todavía no hay noticias publicadas.</p>
      ) : (
        <div>
          {posts.map((post, i) => (
            <NewsCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              category={post.category}
              publishedAt={post.publishedAt}
              index={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}