import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PostForm } from "@/components/admin/PostForm";
import { deletePost, updatePost } from "../actions";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar noticia</h1>
      <PostForm
        action={updatePost}
        submitLabel="Guardar cambios"
        values={{
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
          body: post.body,
          imageUrl: post.imageUrl,
          published: post.published,
        }}
      >
        <input type="hidden" name="id" value={post.id} />
      </PostForm>
      <form action={deletePost}>
        <input type="hidden" name="id" value={post.id} />
        <button className="text-sm text-red-600">Eliminar noticia</button>
      </form>
    </div>
  );
}
