import Link from "next/link";
import { getCuts, getCutResult } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cortes" };

export default async function CutsPage() {
  const cuts = await getCuts();
  const results = await Promise.all(cuts.map((cut) => getCutResult(cut.id)));
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Cortes</h1>
      {cuts.length === 0 ? (
        <p className="text-neutral-500">Todavía no hay cortes definidos.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cuts.map((cut, index) => {
            const result = results[index];
            return (
              <Link key={cut.id} href={`/cortes/${cut.id}`} className="rounded border p-4 hover:bg-neutral-50">
                <h2 className="font-bold">{cut.name} {cut.closed ? "· Cerrado" : ""}</h2>
                {result.winner ? (
                  <p className="mt-2 text-sm">
                    {result.winner.teamName} {cut.closed ? "ganó" : "va liderando"} con {result.winner.total} pts
                    {result.tied ? " (empate)" : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-neutral-500">Sin puntos cargados.</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
