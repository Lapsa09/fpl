import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ShareButtons } from "@/components/ShareButtons";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) return { title: "Noticia no encontrada" };
  const url = `${baseUrl}/noticias/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url,
      images: post.imageUrl ? [{ url: post.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.imageUrl ? [post.imageUrl] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();
  const url = `${baseUrl}/noticias/${post.slug}`;
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <span className="text-xs font-semibold uppercase text-neutral-500">{post.category}</span>
      <h1 className="text-3xl font-black">{post.title}</h1>
      <p className="text-lg text-neutral-600">{post.excerpt}</p>
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="w-full rounded object-cover" />
      ) : null}
      <div className="whitespace-pre-wrap leading-relaxed">{post.body}</div>
      <ShareButtons url={url} title={post.title} />
    </article>
  );
}