/** @jsxImportSource preact */
import { useState, useMemo } from "preact/hooks";

interface Skill {
  id: string;
  name: string;
  tagline: string;
  bundle: string;
  tags: string[];
  activity: number[];
}

interface Props {
  skills: Skill[];
  bundles: string[];
}

export default function CatalogFilter({ skills, bundles }: Props) {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialTag = params?.get("tag") || "";
  const initialBundle = params?.get("bundle") || null;

  const [query, setQuery] = useState(initialTag);
  const [activeBundle, setActiveBundle] = useState<string | null>(initialBundle);

  const filtered = useMemo(() => {
    let result = skills;

    if (activeBundle) {
      result = result.filter((s) => s.bundle === activeBundle);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q))
      );
    }

    return result;
  }, [query, activeBundle, skills]);

  const bundleLabels: Record<string, string> = {
    "meeting-intelligence": "Meetings",
    communication: "Communication",
    research: "Research",
    "content-publishing": "Content",
    "personal-analytics": "Analytics",
    "thinking-strategy": "Thinking",
    "developer-tools": "Developer",
    "lab-consulting": "Lab",
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search preparations..."
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          style={{
            width: "100%",
            padding: "0.6rem 1rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--rule)",
            borderRadius: "4px",
            color: "var(--ink)",
            fontFamily: "'Monaspace Argon', monospace",
            fontSize: "0.82rem",
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveBundle(null)}
          style={{
            padding: "0.25rem 0.7rem",
            background: !activeBundle ? "var(--accent-dim)" : "transparent",
            border: `1px solid ${!activeBundle ? "var(--accent)" : "var(--rule)"}`,
            borderRadius: "3px",
            color: !activeBundle ? "var(--ink)" : "var(--ink-muted)",
            fontFamily: "'Monaspace Argon', monospace",
            fontSize: "0.65rem",
            cursor: "pointer",
          }}
        >
          All ({skills.length})
        </button>
        {bundles.map((b) => {
          const count = skills.filter((s) => s.bundle === b).length;
          const isActive = activeBundle === b;
          return (
            <button
              key={b}
              onClick={() => setActiveBundle(isActive ? null : b)}
              style={{
                padding: "0.25rem 0.7rem",
                background: isActive ? "var(--accent-dim)" : "transparent",
                border: `1px solid ${isActive ? "var(--accent)" : "var(--rule)"}`,
                borderRadius: "3px",
                color: isActive ? "var(--ink)" : "var(--ink-muted)",
                fontFamily: "'Monaspace Argon', monospace",
                fontSize: "0.65rem",
                cursor: "pointer",
              }}
            >
              {bundleLabels[b] || b} ({count})
            </button>
          );
        })}
      </div>

      <p style={{ color: "var(--ink-dim)", fontSize: "0.75rem", fontFamily: "'Monaspace Argon', monospace", marginBottom: "1rem" }}>
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        {activeBundle ? ` in ${bundleLabels[activeBundle] || activeBundle}` : ""}
        {query ? ` matching "${query}"` : ""}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {filtered.map((skill) => (
          <a key={skill.id} href={`/catalog/${skill.id}`} class="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
              <span class="card-title">{skill.name}</span>
              <span class="tag">{bundleLabels[skill.bundle] || skill.bundle}</span>
            </div>
            <p class="card-description" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {skill.tagline}
            </p>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--ink-muted)", padding: "3rem 0", fontStyle: "italic" }}>
          No preparations match your query.
        </p>
      )}
    </div>
  );
}
