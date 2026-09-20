import Link from "next/link";

export function CutCard({
  id, name, order, closed, winnerTeam, winnerPoints, tied,
}: {
  id: string; name: string; order: number; closed: boolean;
  winnerTeam: string | null; winnerPoints: number | null; tied: boolean;
}) {
  return (
    <Link href={`/cortes/${id}`} className="group block rounded-2xl border border-line bg-panel p-6 transition-colors hover:border-accent">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">Corte {order}</p>
          <h2 className="mt-1 text-xl font-bold group-hover:text-accent">{name}</h2>
          {winnerTeam ? (
            <p className="mt-2 text-sm text-muted">
              {closed ? "Ganó" : "Lidera"} <span className="font-semibold text-foreground">{winnerTeam}</span> con{" "}
              <span className="font-mono text-accent">{winnerPoints}</span> pts
              {tied ? " (empate)" : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Sin puntos cargados.</p>
          )}
        </div>
        <span
          className={
            closed
              ? "shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
              : "shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink"
          }
        >
          {closed ? "Cerrado" : "En juego"}
        </span>
      </div>
    </Link>
  );
}