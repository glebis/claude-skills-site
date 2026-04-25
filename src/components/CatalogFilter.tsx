/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from "preact/hooks";

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
  const [query, setQuery] = useState("");
  const [activeBundle, setActiveBundle] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("tag") || params.get("q") || "");
    setActiveBundle(params.get("bundle") || null);
  }, []);

  const updateUrl = (nextQuery: string, nextBundle: string | null) => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (nextQuery.trim()) {
      params.set("tag", nextQuery.trim());
    } else {
      params.delete("tag");
      params.delete("q");
    }

    if (nextBundle) {
      params.set("bundle", nextBundle);
    } else {
      params.delete("bundle");
    }

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    updateUrl(value, activeBundle);
  };

  const handleBundleChange = (bundle: string | null) => {
    setActiveBundle(bundle);
    updateUrl(query, bundle);
  };

  const clearQuery = () => {
    handleQueryChange("");
  };

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
          s.tags.some((t) => t.toLowerCase().includes(q))
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
      <div style={{ position: "relative", marginBottom: query ? "0.75rem" : "1.5rem" }}>
        <input
          type="text"
          placeholder="Search preparations..."
          value={query}
          onInput={(e) => handleQueryChange((e.target as HTMLInputElement).value)}
          style={{
            width: "100%",
            padding: query ? "0.6rem 5.25rem 0.6rem 1rem" : "0.6rem 1rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--rule)",
            borderRadius: "4px",
            color: "var(--ink)",
            fontFamily: "'Monaspace Argon', monospace",
            fontSize: "0.82rem",
            outline: "none",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Clear search"
            style={{
              position: "absolute",
              right: "0.45rem",
              top: "50%",
              transform: "translateY(-50%)",
              padding: "0.24rem 0.65rem",
              background: "transparent",
              border: "1px solid var(--rule)",
              borderRadius: "3px",
              color: "var(--ink-muted)",
              fontFamily: "'Monaspace Argon', monospace",
              fontSize: "0.62rem",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {query && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <span style={{ color: "var(--ink-dim)", fontSize: "0.68rem", fontFamily: "'Monaspace Argon', monospace" }}>
            Search filter
          </span>
          <button
            type="button"
            onClick={clearQuery}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.2rem 0.55rem",
              background: "var(--bg-raised)",
              border: "1px solid var(--rule)",
              borderRadius: "3px",
              color: "var(--ink-light)",
              fontFamily: "'Monaspace Argon', monospace",
              fontSize: "0.64rem",
              cursor: "pointer",
            }}
          >
            {query}
            <span aria-hidden="true" style={{ color: "var(--accent)" }}>×</span>
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <button
          onClick={() => handleBundleChange(null)}
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
              onClick={() => handleBundleChange(isActive ? null : b)}
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
