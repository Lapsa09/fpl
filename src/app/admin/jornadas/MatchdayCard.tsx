"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AdminCard } from "@/components/admin/ui";

export function MatchdayCard({
  title,
  meta,
  actions,
  defaultOpen = false,
  children,
}: {
  title: string;
  meta?: string;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <AdminCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="truncate font-semibold">
            {title}
            {meta ? <span className="ml-2 text-sm font-normal text-muted">{meta}</span> : null}
          </span>
        </button>
        {actions}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </AdminCard>
  );
}
