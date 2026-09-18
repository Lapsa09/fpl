import { notFound } from "next/navigation";
import { getCutResult } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export default async function CutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCutResult(id);
  if (!result.cut) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">{result.cut.name}</h1>
      {result.winner ? (
        <p className="rounded border bg-neutral-50 p-4">
          {result.cut.closed ? "Ganador" : "Va liderando"}: <strong>{result.winner.teamName}</strong> ({result.winner.total} pts)
          {result.tied ? " — definido por la tabla general" : ""}
        </p>
      ) : (
        <p className="text-neutral-500">Sin puntos cargados para este corte.</p>
      )}
      <StandingsTable rows={result.rows} />
    </div>
  );
}