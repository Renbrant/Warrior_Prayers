export function LightTheme() {
  const bg = "#f2efe9";
  const sidebar = "#eae7e0";
  const card = "#ffffff";
  const border = "#ddd9d1";
  const btn = "#ede9e2";
  const btnBorder = "#d4cfc6";
  const orange = "#d97a27";
  const fg = "#13141a";
  const muted = "#6b7280";
  const sidebarBorder = "#d4cfc6";
  const inputBg = "#ffffff";
  const activeSidebar = "#ffffff";

  const requests = [
    { name: "Ana Souza", title: "Cura para minha mãe", badge: "Ativo", badgeBg: "#dcfce7", badgeColor: "#166534", praying: 5, date: "hoje" },
    { name: "Carlos Lima", title: "Direção para nova carreira", badge: "Seguimento", badgeBg: "#dbeafe", badgeColor: "#1d4ed8", praying: 2, date: "2 dias" },
    { name: "Maria Faria", title: "Paz no casamento", badge: "Ativo", badgeBg: "#dcfce7", badgeColor: "#166534", praying: 8, date: "3 dias" },
    { name: "João Paulo", title: "Provisão financeira urgente", badge: "Contestada 🙏", badgeBg: "#ffedd5", badgeColor: "#9a3412", praying: 12, date: "1 sem" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: bg, color: fg, fontSize: 14 }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: sidebar, borderRight: `1px solid ${sidebarBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
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
              background: item.active ? activeSidebar : "transparent",
              border: item.active ? `1px solid ${btnBorder}` : "1px solid transparent",
              color: item.active ? fg : muted,
              fontWeight: item.active ? 600 : 400,
              boxShadow: item.active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
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
              background: i === 0 ? activeSidebar : "transparent",
              border: i === 0 ? `1px solid ${btnBorder}` : "1px solid transparent",
              boxShadow: i === 0 ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: [orange, "#5b8dd9", "#8b5cf6"][i], flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{g}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", padding: "12px 8px", borderTop: `1px solid ${sidebarBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: activeSidebar, border: `1px solid ${btnBorder}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>JD</div>
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
                outline: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }} readOnly />
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: muted, fontSize: 14 }}>🔍</span>
            </div>
            <button style={{
              background: orange, color: "#fff", border: "none", borderRadius: 8,
              padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 1px 3px rgba(217,122,39,0.4)",
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
              cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: [orange + "22", "#5b8dd922", "#8b5cf622", "#4ade8022"][i], border: `1px solid ${[orange + "44", "#5b8dd944", "#8b5cf644", "#4ade8044"][i]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: [orange, "#5b8dd9", "#8b5cf6", "#16a34a"][i], flexShrink: 0 }}>
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

          {/* Light theme callout */}
          <div style={{ marginTop: 8, padding: "10px 14px", background: card, border: `1px solid ${border}`, borderRadius: 10, display: "flex", gap: 10, alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 6, height: 36, borderRadius: 3, background: orange, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: fg, marginBottom: 2 }}>Tema Light</div>
              <div style={{ fontSize: 11, color: muted }}>
                Fundo <span style={{ color: "#5b8dd9" }}>#f2efe9</span> · Card <span style={{ color: "#5b8dd9" }}>#ffffff</span> · Borda <span style={{ color: "#5b8dd9" }}>#ddd9d1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 300, borderLeft: `1px solid ${border}`, background: card, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "-2px 0 8px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: fg, marginBottom: 2 }}>Cura para minha mãe</div>
          <div style={{ fontSize: 12, color: muted }}>Ana Souza · 5 orando</div>
        </div>
        <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 13, color: muted, lineHeight: 1.6, marginBottom: 16 }}>
            Minha mãe foi diagnosticada com uma doença séria esta semana. Peço oração pela cura completa e paz para nossa família durante esse momento difícil.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button style={{ flex: 1, background: orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 4px rgba(217,122,39,0.35)" }}>
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
