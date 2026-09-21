import "dotenv/config";
import { prisma } from "@/lib/db";
import {
  getCutResult,
  getCuts,
  getGeneralStandings,
  getProjectedCutResult,
  getProjectedStandings,
} from "@/lib/data";
import type { StandingRow } from "@/lib/domain/types";

function table(rows: StandingRow[]) {
  return rows.map((r) => ({
    "#": r.rank,
    Equipo: r.teamName,
    Manager: r.manager,
    PJ: r.played,
    Puntos: r.total,
  }));
}

function usage() {
  console.log(`Uso: npm run standings -- [comando]

Comandos:
  general              Tabla general (por defecto)
  projected            Tabla general proyectada (simulador)
  cuts                 Lista de cortes con su ganador
  cut <ref>            Resultado real de un corte (ref: id, nombre u orden)
  cut-projected <ref>  Resultado proyectado de un corte`);
}

function pickCut<T extends { id: string; name: string; order: number }>(cuts: T[], ref: string) {
  const order = Number(ref);
  return cuts.find(
    (c) =>
      c.id === ref ||
      c.name.toLowerCase() === ref.toLowerCase() ||
      (Number.isFinite(order) && c.order === order),
  );
}

function printCut(label: string, rows: StandingRow[], winner: StandingRow | null, tied: boolean) {
  console.log(`\n${label}`);
  if (rows.length === 0) {
    console.log("Sin jornadas asignadas.");
    return;
  }
  console.table(table(rows));
  if (winner) {
    const tiebreak = tied ? " [empate definido por tabla general]" : "";
    console.log(`Ganador: ${winner.teamName} (${winner.manager}) — ${winner.total} pts${tiebreak}`);
  }
}

async function main() {
  const [command = "general", ref] = process.argv.slice(2);

  switch (command) {
    case "general":
      console.log("\nTabla general");
      console.table(table(await getGeneralStandings()));
      break;

    case "projected":
      console.log("\nTabla general proyectada");
      console.table(table(await getProjectedStandings()));
      break;

    case "cuts": {
      const cuts = await getCuts();
      if (cuts.length === 0) {
        console.log("No hay cortes cargados.");
        break;
      }
      for (const cut of cuts) {
        const { rows, winner, tied } = await getCutResult(cut.id);
        printCut(`Corte ${cut.order} — ${cut.name}${cut.closed ? " (cerrado)" : ""}`, rows, winner, tied);
      }
      break;
    }

    case "cut":
    case "cut-projected": {
      if (!ref) {
        usage();
        process.exitCode = 1;
        break;
      }
      const cut = pickCut(await getCuts(), ref);
      if (!cut) {
        console.error(`No existe el corte "${ref}".`);
        process.exitCode = 1;
        break;
      }
      const projected = command === "cut-projected";
      const { rows, winner, tied } = projected
        ? await getProjectedCutResult(cut.id)
        : await getCutResult(cut.id);
      printCut(
        `Corte ${cut.order} — ${cut.name}${projected ? " (proyectado)" : ""}`,
        rows,
        winner,
        tied,
      );
      break;
    }

    default:
      usage();
      process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
