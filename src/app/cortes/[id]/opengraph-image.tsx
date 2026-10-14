import { ImageResponse } from "next/og";
import { getCutResult, getCutPot } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { StandingsCard } from "@/components/share/StandingsCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Corte — Premier Arg";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, pot] = await Promise.all([getCutResult(id), getCutPot()]);
  const winner = result.winner
    ? {
        label: result.cut?.closed ? "Ganador" : "En cabeza",
        name: result.winner.teamName,
        points: result.winner.total,
      }
    : null;
  const prize =
    pot.potAmount > 0 && pot.contributors > 0
      ? `Premio: ${formatMoney(pot.potAmount)} (${formatMoney(pot.quota)} por integrante)`
      : null;
  return new ImageResponse(
    <StandingsCard
      title={result.cut ? `Corte ${result.cut.order} — ${result.cut.name}` : "Corte"}
      subtitle={result.cut?.closed ? "Cerrado" : "En juego"}
      rows={result.rows}
      winner={winner}
      prize={prize}
    />,
    { ...size },
  );
}
