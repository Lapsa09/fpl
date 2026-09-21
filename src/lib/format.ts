export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatMoney(amount: number): string {
  return `$${Math.max(0, Math.trunc(amount)).toLocaleString("es-AR")}`;
}
