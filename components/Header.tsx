"use client";

export type Tab = "recepten" | "planner" | "boodschappen";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "recepten", label: "Recepten", icon: "⌕" },
  { id: "planner", label: "Weekplanner", icon: "▦" },
  { id: "boodschappen", label: "Boodschappen", icon: "☷" },
];

export function Header({ tab, onTabChange }: { tab: Tab; onTabChange: (tab: Tab) => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" onClick={() => onTabChange("recepten")} aria-label="Naar recepten">
          <span className="logo-shell"><img src="/logo.png" alt="" width="44" height="44" /></span>
          <span className="brand-copy">
            <strong>Wat eten we vanavond?</strong>
            <small>jouw opgeslagen recepten, gepland en gebundeld</small>
          </span>
        </button>
        <nav className="tabs" aria-label="Hoofdnavigatie">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={`tab ${tab === item.id ? "is-active" : ""}`}
              onClick={() => onTabChange(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
