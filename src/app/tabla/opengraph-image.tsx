import { ImageResponse } from "next/og";
import { getGeneralStandings } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { StandingsCard } from "@/components/share/StandingsCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Tabla general — Premier Arg";

export default async function Image() {
  const rows = await getGeneralStandings();
  return new ImageResponse(
    <StandingsCard title="Tabla general" subtitle={`Premier Arg · ${formatDate(new Date())}`} rows={rows} />,
    { ...size },
  );
}
