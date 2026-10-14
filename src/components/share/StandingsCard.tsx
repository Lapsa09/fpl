import type { StandingRow } from "@/lib/domain/types";

const COLOR = {
  background: "#170431",
  panel: "#220844",
  border: "#5e2fa3",
  foreground: "#ffffff",
  muted: "#c9b6ea",
  accent: "#2dd4ff",
  gold: "#ffc21a",
};

export function StandingsCard({
  title,
  subtitle,
  rows,
  winner,
  prize,
}: {
  title: string;
  subtitle?: string;
  rows: StandingRow[];
  winner?: { label: string; name: string; points: number } | null;
  prize?: string | null;
}) {
  const visible = rows.slice(0, 10);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "36px 48px",
        color: COLOR.foreground,
        background: `linear-gradient(135deg, #230848 0%, ${COLOR.background} 60%)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 30, fontWeight: 900, letterSpacing: -1 }}>
          <span>PREMIER</span>
          <span style={{ color: COLOR.accent, marginLeft: 8 }}>ARG</span>
        </div>
        {subtitle ? <div style={{ display: "flex", fontSize: 20, color: COLOR.muted }}>{subtitle}</div> : null}
      </div>

      <div style={{ display: "flex", marginTop: 12, fontSize: 38, fontWeight: 900, letterSpacing: -1 }}>{title}</div>

      {winner ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 12,
            padding: "10px 16px",
            borderRadius: 14,
            background: COLOR.panel,
            border: `1px solid ${COLOR.border}`,
          }}
        >
          <span style={{ display: "flex", fontSize: 15, letterSpacing: 3, color: COLOR.muted, marginRight: 14 }}>
            {winner.label.toUpperCase()}
          </span>
          <span style={{ display: "flex", fontSize: 26, fontWeight: 800 }}>{winner.name}</span>
          <span style={{ display: "flex", fontSize: 26, fontWeight: 800, color: COLOR.accent, marginLeft: 12 }}>
            {winner.points} pts
          </span>
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
        {visible.map((row) => (
          <div
            key={row.teamId}
            style={{
              display: "flex",
              alignItems: "center",
              height: 34,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                display: "flex",
                width: 48,
                justifyContent: "center",
                fontSize: 19,
                fontWeight: 900,
                color: row.rank <= 3 ? COLOR.gold : COLOR.muted,
              }}
            >
              {row.rank}
            </span>
            <span style={{ display: "flex", flex: 1, fontSize: 19, fontWeight: 700 }}>{row.teamName}</span>
            <span style={{ display: "flex", width: 84, justifyContent: "flex-end", fontSize: 19, fontWeight: 700 }}>
              {row.total}
            </span>
          </div>
        ))}
      </div>

      {prize ? <div style={{ display: "flex", marginTop: 12, fontSize: 18, color: COLOR.muted }}>{prize}</div> : null}
    </div>
  );
}
