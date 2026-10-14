"use client";

import { useRef, useState } from "react";
import { StandingsTable } from "@/components/StandingsTable";
import type { StandingRow } from "@/lib/domain/types";
import type { PrizeRule } from "@/lib/domain/prizes";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ShareableStandingsTable({
  rows,
  prizes,
  title,
  fileName,
  shareTitle,
}: {
  rows: StandingRow[];
  prizes?: PrizeRule[];
  title?: string;
  fileName: string;
  shareTitle: string;
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function onShare() {
    const node = captureRef.current;
    if (!node) return;
    setState("loading");
    try {
      if (document.fonts) await document.fonts.ready;
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(node, {
        pixelRatio: 2,
        backgroundColor: "#170431",
        cacheBust: true,
      });
      if (!blob) throw new Error("capture failed");
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: shareTitle });
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            setState("idle");
            return;
          }
          downloadBlob(blob, fileName);
        }
      } else {
        downloadBlob(blob, fileName);
      }
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <div ref={captureRef} className="p-6">
        <StandingsTable rows={rows} title={title} prizes={prizes} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-muted">Compartir</span>
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
    </div>
  );
}
