"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { POST_CATEGORIES } from "@/components/NewsCard";
import {
  AdminCard,
  AdminPrimaryButton,
  adminInputClassName,
  adminLabelClassName,
} from "@/components/admin/ui";

type PostValues = {
  title?: string;
  excerpt?: string;
  category?: string;
  body?: string;
  imageUrl?: string | null;
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
    <AdminCard>
      <form action={action} className="space-y-4">
        {children}
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <label className={adminLabelClassName}>
          Título
          <input name="title" required defaultValue={values.title} placeholder="Título de la noticia" className={`w-full ${adminInputClassName}`} />
        </label>
        <label className={adminLabelClassName}>
          Bajada
          <input name="excerpt" required defaultValue={values.excerpt} placeholder="Resumen corto" className={`w-full ${adminInputClassName}`} />
        </label>
        <label className={adminLabelClassName}>
          Categoría
          <select name="category" defaultValue={values.category ?? "STATEMENTS"} className={adminInputClassName}>
            {POST_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className={adminLabelClassName}>
          Cuerpo
          <textarea name="body" required rows={10} defaultValue={values.body} className={`w-full ${adminInputClassName}`} />
        </label>
        <div className="space-y-2">
          <span className="block text-sm font-medium">Imagen destacada</span>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-40 rounded-xl border border-line object-cover" />
          ) : null}
          <UploadButton
            endpoint="newsImage"
            appearance={{
              button: "rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink",
              allowedContent: "text-xs text-muted",
            }}
            onClientUploadComplete={(res) => setImageUrl(res?.[0]?.ufsUrl ?? "")}
          />
        </div>
        <AdminPrimaryButton>{submitLabel}</AdminPrimaryButton>
      </form>
    </AdminCard>
  );
}
