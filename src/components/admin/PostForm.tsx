"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";

const categories = [
  ["TRANSFERS", "Traspasos"],
  ["DECLARATIONS", "Declaraciones"],
  ["STATEMENTS", "Comunicados"],
  ["GENERAL", "General"],
] as const;

type PostValues = {
  title?: string;
  excerpt?: string;
  category?: string;
  body?: string;
  imageUrl?: string | null;
  published?: boolean;
};

export function PostForm({
  action,
  values = {},
  submitLabel,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: PostValues;
  submitLabel: string;
  children?: React.ReactNode;
}) {
  const [imageUrl, setImageUrl] = useState(values.imageUrl ?? "");
  return (
    <form action={action} className="space-y-4">
      {children}
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <label className="block text-sm">
        Título
        <input name="title" required defaultValue={values.title} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <label className="block text-sm">
        Bajada
        <input name="excerpt" required defaultValue={values.excerpt} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <label className="block text-sm">
        Categoría
        <select name="category" defaultValue={values.category ?? "GENERAL"} className="mt-1 rounded border px-2 py-1">
          {categories.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Cuerpo
        <textarea name="body" required rows={10} defaultValue={values.body} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <div className="space-y-2">
        <span className="block text-sm">Imagen destacada</span>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-40 rounded object-cover" />
        ) : null}
        <UploadButton
          endpoint="newsImage"
          onClientUploadComplete={(res) => setImageUrl(res?.[0]?.ufsUrl ?? "")}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={values.published} /> Publicada
      </label>
      <button className="rounded bg-black px-4 py-2 text-sm text-white">{submitLabel}</button>
    </form>
  );
}
