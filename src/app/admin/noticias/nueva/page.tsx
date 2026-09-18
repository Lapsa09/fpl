import { PostForm } from "@/components/admin/PostForm";
import { createPost } from "../actions";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nueva noticia</h1>
      <PostForm action={createPost} submitLabel="Crear noticia" />
    </div>
  );
}
