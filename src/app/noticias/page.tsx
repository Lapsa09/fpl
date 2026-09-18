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
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Noticias</h1>
      {posts.length === 0 ? (
        <p className="text-neutral-500">Todavía no hay noticias publicadas.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <NewsCard key={post.id} slug={post.slug} title={post.title}
              excerpt={post.excerpt} imageUrl={post.imageUrl} category={post.category} />
          ))}
        </div>
      )}
    </div>
  );
}