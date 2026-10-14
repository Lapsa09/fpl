import { getGeneralStandings, getPrizeRules } from "@/lib/data";
import { StandingsTable, PrizeLegend } from "@/components/StandingsTable";
import { Podium } from "@/components/Podium";
import { ShareImageButton } from "@/components/ShareImageButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tabla de posiciones",
  description: "Tabla general de la temporada, con premios por puesto.",
  openGraph: {
    title: "Tabla de posiciones",
    description: "Tabla general de la temporada, con premios por puesto.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tabla de posiciones",
    description: "Tabla general de la temporada, con premios por puesto.",
  },
};

export default async function StandingsPage() {
  const rows = await getGeneralStandings();
  const prizes = await getPrizeRules();
  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">General</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">Tabla de posiciones</h1>
      </header>
      {rows.length === 0 ? (
        <p className="text-muted">La temporada todavía no arrancó.</p>
      ) : (
        <div className="space-y-10">
          <Podium rows={rows} />
          <StandingsTable rows={rows} title="Tabla anual - Fantasy Premier League" prizes={prizes} />
          <PrizeLegend prizes={prizes} />
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-muted">Compartir</span>
            <ShareImageButton
              imagePath="/tabla/opengraph-image"
              fileName="premier-arg-tabla-general.png"
              title="Tabla general — Premier Arg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
