import { getGeneralStandings } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tabla de posiciones" };

export default async function StandingsPage() {
  const rows = await getGeneralStandings();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Tabla de posiciones</h1>
      {rows.length === 0 ? (
        <p className="text-neutral-500">La temporada todavía no arrancó.</p>
      ) : (
        <StandingsTable rows={rows} />
      )}
    </div>
  );
}
