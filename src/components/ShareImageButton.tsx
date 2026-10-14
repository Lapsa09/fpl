"use client";

import { useState } from "react";

export function ShareImageButton({
  imagePath,
  fileName,
  title,
}: {
  imagePath: string;
  fileName: string;
  title: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function onShare() {
    setState("loading");
    try {
      const res = await fetch(imagePath);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
      setState("idle");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setState("idle");
        return;
      }
      setState("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onShare}
        disabled={state === "loading"}
        className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-foreground disabled:opacity-60"
      >
        {state === "loading" ? "Generando…" : "Compartir imagen"}
      </button>
      {state === "error" ? (
        <span className="text-sm font-semibold text-danger">No se pudo generar la imagen</span>
      ) : null}
    </div>
  );
}
