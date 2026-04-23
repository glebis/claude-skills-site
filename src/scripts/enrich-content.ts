#!/usr/bin/env npx tsx
/**
 * Enrich skill MDX files with bundle assignments, tags, taglines, and apothecary names.
 * Run once to populate human-curated fields, then hand-edit to refine.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

const CONTENT_DIR = resolve(import.meta.dirname, "../content/skills");

const BUNDLE_MAP: Record<string, string> = {
  fathom: "meeting-intelligence",
  granola: "meeting-intelligence",
  zoom: "meeting-intelligence",
  "transcript-analyzer": "meeting-intelligence",
  "meeting-processor": "meeting-intelligence",
  "youtube-transcript": "meeting-intelligence",
  "elevenlabs-tts": "meeting-intelligence",

  telegram: "communication",
  "telegram-telethon": "communication",
  "telegram-post": "communication",
  gws: "communication",
  gmail: "communication",

  "deep-research": "research",
  "firecrawl-research": "research",
  doctorg: "research",
  "chrome-history": "research",
  "google-image-search": "research",
  "browsing-history": "research",

  "nano-banana": "content-publishing",
  "gpt-image-2": "content-publishing",
  "presentation-generator": "content-publishing",
  "pdf-generation": "content-publishing",
  "tufte-report": "content-publishing",
  "brand-agency": "content-publishing",
  sketch: "content-publishing",
  "vision-bench": "content-publishing",

  "health-data": "personal-analytics",
  "wispr-analytics": "personal-analytics",
  "temple-generator": "personal-analytics",

  balanced: "thinking-strategy",
  "decision-toolkit": "thinking-strategy",
  jtbd: "thinking-strategy",
  "skill-studio": "thinking-strategy",

  tdd: "developer-tools",
  "llm-cli": "developer-tools",
  "github-gist": "developer-tools",
  linear: "developer-tools",
  "session-finder": "developer-tools",
  "session-search": "developer-tools",

  "agency-docs-updater": "lab-consulting",
  "lab-retro": "lab-consulting",
  "context-builder": "lab-consulting",
  recording: "lab-consulting",
};

const TAGLINES: Record<string, string> = {
  "agency-docs-updater": "One command to publish a lab meeting — transcript to YouTube to docs site.",
  balanced: "The anti-sycophancy engine. Forces multi-perspective analysis before you commit.",
  "brand-agency": "Instant neobrutalist styling for any artifact you produce.",
  "browsing-history": "What have you been reading? Query your browsing history in plain English.",
  "chrome-history": "Search your Chrome history by date, type, keywords — no scrolling.",
  "context-builder": "Generate structured discovery prompts for consulting clients.",
  "decision-toolkit": "Step-by-step guides, bias checkers, and scenario explorers for hard choices.",
  "deep-research": "Drop a question, get a research report. Powered by OpenAI Deep Research.",
  doctorg: "Evidence-based health answers with GRADE ratings and your Apple Health context.",
  "elevenlabs-tts": "Turn any text into spoken audio with ElevenLabs voices.",
  fathom: "Pull meeting transcripts, summaries, and action items from Fathom into your vault.",
  "firecrawl-research": "Scrape the web systematically, generate bibliographies, write papers.",
  "github-gist": "Publish any file as a GitHub Gist in one command.",
  gmail: "Search, fetch, and download emails and attachments from Gmail.",
  "google-image-search": "Find images via Google, let the LLM pick the best one, download.",
  "gpt-image-2": "Generate and edit images with OpenAI. Best-in-class text rendering.",
  granola: "Import Granola meeting recordings and transcripts into Obsidian.",
  gws: "Gmail, Calendar, Drive, Sheets, Tasks, Chat — all from the terminal.",
  "health-data": "Query your Apple Health database for vitals, activity, sleep, and workouts.",
  jtbd: "Jobs-to-Be-Done interviews, review mining, and opportunity scoring.",
  "lab-retro": "End-of-cohort retrospective and self-assessment for lab graduates.",
  linear: "Create, list, update, and search Linear issues without leaving the terminal.",
  "llm-cli": "Pipe any file through any LLM provider — OpenAI, Anthropic, Gemini, Ollama.",
  "meeting-processor": "Auto-detect meeting type, extract structured analysis from transcripts.",
  "nano-banana": "Generate images with Google Gemini. Fast, cheap, good for iteration.",
  "pdf-generation": "Markdown to professional PDF with Eisvogel template and EB Garamond.",
  "presentation-generator": "HTML presentations with neobrutalism styling and Agency brand colors.",
  recording: "Redact PII in real time during screen-shares and demos.",
  "session-finder": "Every session you've ever had, one query away. Semantic search + instant relaunch.",
  "session-search": "Keyword search across Claude Code session transcripts.",
  "skill-studio": "Design your next automation through a structured JTBD interview.",
  tdd: "Enforced RED-GREEN-REFACTOR with separate agents for tests and implementation.",
  telegram: "Fetch, search, send, edit Telegram messages with Obsidian integration.",
  "telegram-telethon": "Full Telegram automation — daemon mode, Claude Code spawning, voice transcription.",
  "temple-generator": "3D interactive Three.js knowledge visualization from any Obsidian vault.",
  "transcript-analyzer": "Extract decisions, action items, opinions, and terminology from transcripts.",
  "tufte-report": "Tufte-inspired HTML data reports with Chart.js, sparklines, and editorial prose.",
  "vision-bench": "Score and compare images using vision LLMs as judges.",
  "wispr-analytics": "Analyze voice dictation patterns for work habits and sentiment.",
  "youtube-transcript": "Extract YouTube video transcripts and metadata as Markdown.",
  zoom: "Create Zoom meetings and access cloud recordings via the API.",
};

const APOTHECARY_NAMES: Record<string, string> = {
  "agency-docs-updater": "The Publisher's Engine",
  balanced: "Tincture of Equipoise",
  "brand-agency": "The Printer's Ink",
  "browsing-history": "Essence of Recollection",
  "chrome-history": "The Browser's Ledger",
  "context-builder": "The Discovery Lens",
  "decision-toolkit": "Compound of Clarity",
  "deep-research": "The Scholar's Deep Draught",
  doctorg: "The Physician's Reference",
  "elevenlabs-tts": "Elixir of Voice",
  fathom: "The Listener's Extract",
  "firecrawl-research": "The Web Spider's Thread",
  "github-gist": "Quick-Share Tincture",
  gmail: "Mercury's Pouch",
  "google-image-search": "The Image Diviner",
  "gpt-image-2": "The Illustrator's Compound",
  granola: "The Meeting Grain",
  gws: "The Workspace Keyring",
  "health-data": "The Body's Ledger",
  jtbd: "The Hiring Compass",
  "lab-retro": "The Retrospectoscope",
  linear: "The Task Crucible",
  "llm-cli": "The Universal Solvent",
  "meeting-processor": "The Classifier's Sieve",
  "nano-banana": "The Quick Sketch",
  "pdf-generation": "The Binding Press",
  "presentation-generator": "The Slide Forge",
  recording: "The Privacy Veil",
  "session-finder": "Tincture of Recall",
  "session-search": "The Session Sieve",
  "skill-studio": "The Automation Architect",
  tdd: "The Test Anvil",
  telegram: "The Telegram Wire",
  "telegram-telethon": "The Daemon's Relay",
  "temple-generator": "The Inner Temple",
  "transcript-analyzer": "The Transcript Alembic",
  "tufte-report": "The Data Apothecary",
  "vision-bench": "The Judge's Loupe",
  "wispr-analytics": "The Voice Mirror",
  "youtube-transcript": "The Video Scribe",
  zoom: "The Meeting Glass",
};

const TAGS: Record<string, string[]> = {
  "agency-docs-updater": ["publishing", "youtube", "docs", "pipeline"],
  balanced: ["thinking", "feedback", "anti-sycophancy"],
  "brand-agency": ["design", "css", "branding"],
  "browsing-history": ["search", "history", "personal-data"],
  "chrome-history": ["search", "history", "chrome"],
  "context-builder": ["consulting", "prompts", "discovery"],
  "decision-toolkit": ["thinking", "decisions", "frameworks"],
  "deep-research": ["research", "web-search", "openai"],
  doctorg: ["health", "research", "evidence"],
  "elevenlabs-tts": ["audio", "voice", "tts"],
  fathom: ["meetings", "transcripts", "obsidian"],
  "firecrawl-research": ["research", "scraping", "bibliography"],
  "github-gist": ["github", "sharing", "snippets"],
  gmail: ["email", "google", "attachments"],
  "google-image-search": ["images", "search", "google"],
  "gpt-image-2": ["images", "generation", "openai"],
  granola: ["meetings", "transcripts", "obsidian"],
  gws: ["google", "email", "calendar", "drive"],
  "health-data": ["health", "apple-health", "quantified-self"],
  jtbd: ["product", "strategy", "interviews"],
  "lab-retro": ["education", "retrospective", "lab"],
  linear: ["project-management", "issues", "tasks"],
  "llm-cli": ["llm", "multi-provider", "cli"],
  "meeting-processor": ["meetings", "analysis", "classification"],
  "nano-banana": ["images", "generation", "gemini"],
  "pdf-generation": ["pdf", "publishing", "pandoc"],
  "presentation-generator": ["presentations", "html", "slides"],
  recording: ["privacy", "pii", "demo"],
  "session-finder": ["sessions", "search", "embeddings"],
  "session-search": ["sessions", "search", "transcripts"],
  "skill-studio": ["automation", "design", "jtbd"],
  tdd: ["testing", "development", "red-green-refactor"],
  telegram: ["messaging", "telegram", "obsidian"],
  "telegram-telethon": ["messaging", "telegram", "automation"],
  "temple-generator": ["visualization", "3d", "obsidian"],
  "transcript-analyzer": ["transcripts", "analysis", "action-items"],
  "tufte-report": ["reports", "data-viz", "html"],
  "vision-bench": ["images", "evaluation", "llm-judge"],
  "wispr-analytics": ["voice", "dictation", "analytics"],
  "youtube-transcript": ["youtube", "transcripts", "obsidian"],
  zoom: ["meetings", "zoom", "recordings"],
};

function main() {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  let updated = 0;

  for (const file of files) {
    const slug = file.replace(".mdx", "");
    const path = join(CONTENT_DIR, file);
    let content = readFileSync(path, "utf-8");
    let changed = false;

    const bundle = BUNDLE_MAP[slug];
    if (bundle && content.includes("bundle: uncategorized")) {
      content = content.replace("bundle: uncategorized", `bundle: ${bundle}`);
      changed = true;
    }

    const tagline = TAGLINES[slug];
    if (tagline && content.includes('tagline: ""')) {
      content = content.replace('tagline: ""', `tagline: "${tagline}"`);
      changed = true;
    }

    const apoth = APOTHECARY_NAMES[slug];
    if (apoth && content.includes('apothecary_name: ""')) {
      content = content.replace('apothecary_name: ""', `apothecary_name: "${apoth}"`);
      changed = true;
    }

    const tags = TAGS[slug];
    if (tags && content.includes("tags: []")) {
      content = content.replace("tags: []", `tags: ${JSON.stringify(tags)}`);
      changed = true;
    }

    if (changed) {
      writeFileSync(path, content);
      updated++;
      console.log(`  ✏ ${slug}`);
    }
  }

  console.log(`\nEnriched ${updated} skills.`);
}

main();
