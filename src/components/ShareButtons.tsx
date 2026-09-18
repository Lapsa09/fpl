"use client";

import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const targets = [
    ["WhatsApp", `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`],
    ["X", `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`],
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noreferrer"
          className="rounded border px-3 py-1 text-sm hover:bg-neutral-100">
          {label}
        </a>
      ))}
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
        className="rounded border px-3 py-1 text-sm hover:bg-neutral-100"
      >
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
