export function DarkContrast() {
  const bg = "#0d0e14";
  const sidebar = "#0d0e14";
  const card = "#181a24";
  const cardHover = "#1e2130";
  const border = "#2c3048";
  const btn = "#1e2130";
  const btnBorder = "#2c3048";
  const orange = "#d97a27";
  const orangeHover = "#c06a1a";
  const fg = "#f2f4f8";
  const muted = "#8b96a8";
  const sidebarBorder = "#232638";
  const inputBg = "#181a24";

  const requests = [
    { name: "Ana Souza", title: "Cura para minha mãe", badge: "Ativo", badgeBg: "#1a3a1a", badgeColor: "#4ade80", praying: 5, date: "hoje" },
    { name: "Carlos Lima", title: "Direção para nova carreira", badge: "Seguimento", badgeBg: "#1a2e3a", badgeColor: "#60a5fa", praying: 2, date: "2 dias" },
    { name: "Maria Faria", title: "Paz no casamento", badge: "Ativo", badgeBg: "#1a3a1a", badgeColor: "#4ade80", praying: 8, date: "3 dias" },
    { name: "João Paulo", title: "Provisão financeira urgente", badge: "Contestada 🙏", badgeBg: "#2a1a0a", badgeColor: "#fb923c", praying: 12, date: "1 sem" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: bg, color: fg, fontSize: 14 }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: sidebar, borderRight: `1px solid ${sidebarBorder}`, display: "flex", flexDirection: "column", padding: "0", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${sidebarBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🙏</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: fg }}>Warrior Prayers</span>
          </div>
        </div>

        <div style={{ padding: "8px 8px" }}>
          {[
            { icon: "🏠", label: "Início", active: false },
            { icon: "👥", label: "Grupos", active: true },
            { icon: "🔔", label: "Notificações", active: false, badge: "3" },
            { icon: "🙏", label: "Modo Oração", active: false },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              borderRadius: 8, marginBottom: 2, cursor: "pointer",
              background: item.active ? btn : "transparent",
              border: item.active ? `1px solid ${btnBorder}` : "1px solid transparent",
              color: item.active ? fg : muted,
              fontWeight: item.active ? 600 : 400,
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: orange, color: "#fff", borderRadius: 10, fontSize: 11, padding: "1px 6px", fontWeight: 700 }}>{item.badge}</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: "8px 8px", marginTop: 8, borderTop: `1px solid ${sidebarBorder}` }}>
          <div style={{ fontSize: 10, color: muted, padding: "4px 10px 6px", textTransform: "uppercase", letterSpacing: 1 }}>Grupos</div>
          {["Família Batista", "Cell Jovens", "Líderes"].map((g, i) => (
            <div key={g} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
              borderRadius: 8, marginBottom: 2, color: i === 0 ? fg : muted, cursor: "pointer",
              background: i === 0 ? btn : "transparent",
              border: i === 0 ? `1px solid ${btnBorder}` : "1px solid transparent",
            }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: [orange, "#5b8dd9", "#8b5cf6"][i], opacity: 0.9, flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{g}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", padding: "12px 8px", borderTop: `1px solid ${sidebarBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: btn, border: `1px solid ${btnBorder}` }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>JD</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>João Dias</div>
              <div style={{ fontSize: 11, color: muted }}>Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 12, background: bg }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: fg }}>Família Batista</div>
            <div style={{ fontSize: 12, color: muted }}>12 membros · 23 petições ativas</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <input placeholder="Buscar petições…" style={{
                background: inputBg, border: `1px solid ${border}`, borderRadius: 8,
                padding: "6px 12px 6px 32px", color: fg, fontSize: 13, width: 200,
                outline: "none",
              }} readOnly />
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: muted, fontSize: 14 }}>🔍</span>
            </div>
            <button style={{
              background: orange, color: "#fff", border: "none", borderRadius: 8,
              padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 16 }}>+</span> Nova Petição
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((r, i) => (
            <div key={i} style={{
              background: card, border: `1px solid ${border}`, borderRadius: 12,
              padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 14,
              cursor: "pointer",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: [orange + "33", "#5b8dd933", "#8b5cf633", "#4ade8033"][i], border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: [orange, "#5b8dd9", "#8b5cf6", "#4ade80"][i], flexShrink: 0 }}>
                {r.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: fg, fontSize: 14 }}>{r.title}</span>
                  <span style={{ background: r.badgeBg, color: r.badgeColor, borderRadius: 6, fontSize: 11, padding: "2px 8px", fontWeight: 500 }}>{r.badge}</span>
                </div>
                <div style={{ fontSize: 12, color: muted }}>
                  {r.name} · {r.praying} orando · {r.date}
                </div>
              </div>
              <button style={{ background: btn, border: `1px solid ${btnBorder}`, color: fg, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                🙏 Orar
              </button>
            </div>
          ))}

          {/* Contrast callout */}
          <div style={{ marginTop: 8, padding: "10px 14px", background: card, border: `1px solid ${border}`, borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 6, height: 36, borderRadius: 3, background: orange, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: fg, marginBottom: 2 }}>Dark melhorado</div>
              <div style={{ fontSize: 11, color: muted }}>
                Fundo <span style={{ color: "#5b8dd9" }}>#0d0e14</span> · Card <span style={{ color: "#5b8dd9" }}>#181a24</span> · Borda <span style={{ color: "#5b8dd9" }}>#2c3048</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 300, borderLeft: `1px solid ${border}`, background: card, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: fg, marginBottom: 2 }}>Cura para minha mãe</div>
          <div style={{ fontSize: 12, color: muted }}>Ana Souza · 5 orando</div>
        </div>
        <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 13, color: muted, lineHeight: 1.6, marginBottom: 16 }}>
            Minha mãe foi diagnosticada com uma doença séria esta semana. Peço oração pela cura completa e paz para nossa família durante esse momento difícil.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button style={{ flex: 1, background: orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              🙏 Estou Orando
            </button>
          </div>
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: fg, marginBottom: 8 }}>Comentários</div>
            {["Orando! 🙏", "Com vocês nessa."].map((c, i) => (
              <div key={i} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 10px", marginBottom: 6, fontSize: 12, color: muted }}>
                <span style={{ color: fg, fontWeight: 500, marginRight: 6 }}>{["Maria", "Carlos"][i]}:</span>{c}
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input placeholder="Comentar…" style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "6px 10px", color: fg, fontSize: 12, outline: "none" }} readOnly />
              <button style={{ background: btn, border: `1px solid ${btnBorder}`, color: fg, borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>↑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
