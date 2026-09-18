"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";
import { slugify } from "@/lib/slug";

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = base || "noticia";
  let candidate = root;
  let n = 2;
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${root}-${n++}`;
  }
}

function readPost(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    category: String(formData.get("category") ?? "GENERAL") as
      | "TRANSFERS" | "DECLARATIONS" | "STATEMENTS" | "GENERAL",
    body: String(formData.get("body") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    published: formData.get("published") === "on",
  };
}

export async function createPost(formData: FormData) {
  await requireAdmin();
  const data = readPost(formData);
  if (!data.title || !data.excerpt || !data.body) return;
  const slug = await uniqueSlug(slugify(data.title));
  const post = await prisma.post.create({
    data: { ...data, slug, publishedAt: data.published ? new Date() : null },
  });
  revalidatePath("/admin/noticias");
  redirect(`/admin/noticias/${post.id}`);
}

export async function updatePost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = readPost(formData);
  const current = await prisma.post.findUnique({ where: { id } });
  if (!current || !data.title || !data.excerpt || !data.body) return;
  const slug = await uniqueSlug(slugify(data.title), id);
  await prisma.post.update({
    where: { id },
    data: {
      ...data,
      slug,
      publishedAt: data.published ? current.publishedAt ?? new Date() : null,
    },
  });
  revalidatePath("/admin/noticias");
  revalidatePath(`/noticias/${slug}`);
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/noticias");
  redirect("/admin/noticias");
}