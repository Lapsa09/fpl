import type { ButtonHTMLAttributes, ReactNode } from "react";

export const adminInputClassName =
  "rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export const adminLabelClassName = "flex flex-col gap-1 text-sm font-medium";

export const adminPrimaryClassName =
  "rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50";

export const adminGhostClassName =
  "rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-accent disabled:opacity-50";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-panel p-4 ${className}`}>{children}</div>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AdminPrimaryButton({ className = "", ...props }: ButtonProps) {
  return <button {...props} className={`${adminPrimaryClassName} ${className}`} />;
}

export function AdminGhostButton({ className = "", ...props }: ButtonProps) {
  return <button {...props} className={`${adminGhostClassName} ${className}`} />;
}
