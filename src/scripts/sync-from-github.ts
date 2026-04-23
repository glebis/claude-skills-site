#!/usr/bin/env npx tsx
/**
 * Sync skills from glebis/claude-skills repo into Astro content collections.
 *
 * - Reads SKILL.md from each skill directory
 * - Extracts frontmatter + description
 * - Creates/updates MDX files, preserving human-written fields
 * - Creates a PR-ready diff
 *
 * Usage:
 *   npx tsx src/scripts/sync-from-github.ts [--local /path/to/claude-skills]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

const CONTENT_DIR = resolve(import.meta.dirname, "../content/skills");
const SKIP_DIRS = new Set(["meta", "node_modules", ".git", "concepts", "secrets.enc.yaml"]);

interface SkillMeta {
  slug: string;
  name: string;
  description: string;
  triggers: string[];
  repoPath: string;
}

function parseSkillMd(content: string, slug: string): SkillMeta | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const fm = fmMatch[1];
  const body = content.slice(fmMatch[0].length).trim();

  const nameMatch = fm.match(/^name:\s*(.+)$/m);
  const descMatch = fm.match(/^description:\s*(.+)$/m);

  const name = nameMatch?.[1]?.trim() || slug;
  const description = descMatch?.[1]?.trim() || "";

  // Extract trigger phrases from description
  const triggerMatch = description.match(/Triggers?\s+on\s+["']?(.+?)["']?[.,]/i);
  const triggers: string[] = [];
  if (triggerMatch) {
    triggers.push(
      ...triggerMatch[1].split(/[,"]/).map((t) => t.replace(/^["'\s]+|["'\s]+$/g, "")).filter((t) => t.length > 2)
    );
  }

  return { slug, name, description, triggers, repoPath: slug };
}

function loadExistingMdx(slug: string): Record<string, string> {
  const path = join(CONTENT_DIR, `${slug}.mdx`);
  if (!existsSync(path)) return {};

  const content = readFileSync(path, "utf-8");
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return {};

  const fields: Record<string, string> = {};
  for (const line of fmMatch[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) fields[m[1]] = m[2];
  }
  return fields;
}

function getLastCommitDates(skillsDir: string): Record<string, string> {
  try {
    const result = execSync(
      `for d in $(ls -d */SKILL.md 2>/dev/null | sed 's|/SKILL.md||'); do echo "$(git log -1 --format='%ai' -- "$d/" 2>/dev/null | cut -d' ' -f1) $d"; done`,
      { cwd: skillsDir, encoding: "utf-8", shell: "/bin/bash", timeout: 15000 }
    );
    const dates: Record<string, string> = {};
    for (const line of result.trim().split("\n")) {
      const [date, skill] = line.split(" ");
      if (date && skill) dates[skill] = date;
    }
    return dates;
  } catch {
    return {};
  }
}

function getWeeklyActivity(skillsDir: string): Record<string, number[]> {
  try {
    const result = execSync(
      `git log --since="12 weeks ago" --format="COMMIT:%ad" --date=format:"%Y-%V" --name-only`,
      { cwd: skillsDir, encoding: "utf-8", timeout: 10000 }
    );

    const activity: Record<string, Record<string, number>> = {};
    let currentWeek: string | null = null;

    for (const line of result.split("\n")) {
      if (line.startsWith("COMMIT:")) {
        currentWeek = line.slice(7);
      } else if (line.includes("/") && currentWeek) {
        const skill = line.split("/")[0];
        if (!activity[skill]) activity[skill] = {};
        activity[skill][currentWeek] = (activity[skill][currentWeek] || 0) + 1;
      }
    }

    const now = new Date();
    const weeks: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const year = d.getFullYear();
      const jan1 = new Date(year, 0, 1);
      const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
      weeks.push(`${year}-${String(week).padStart(2, "0")}`);
    }

    const output: Record<string, number[]> = {};
    for (const [skill, weekData] of Object.entries(activity)) {
      output[skill] = weeks.map((w) => weekData[w] || 0);
    }
    return output;
  } catch {
    return {};
  }
}

function generateMdx(skill: SkillMeta, existing: Record<string, string>, activity?: number[], lastCommit?: string): string {
  const now = new Date().toISOString().slice(0, 10);

  const unquote = (s: string) => s.replace(/^["'](.*)["']$/, "$1");

  const tagline = existing.tagline || '""';
  const apothecaryName = existing.apothecary_name || '""';
  const bundle = unquote(existing.bundle || "uncategorized");
  const tags = existing.tags || "[]";
  const accentColor = unquote(existing.accent_color || "amber");
  const heroImage = unquote(existing.hero_image || "");
  const installCommand = unquote(existing.install_command || "");
  const dependencies = existing.dependencies || "[]";

  return `---
name: "${skill.name}"
tagline: ${tagline}
apothecary_name: ${apothecaryName}
bundle: ${bundle}
tags: ${tags}
accent_color: ${accentColor}
${heroImage ? `hero_image: ${heroImage}` : "# hero_image:"}
auto_description: "${skill.description.replace(/"/g, '\\"')}"
auto_triggers: ${JSON.stringify(skill.triggers)}
auto_tools: []
auto_last_synced: "${now}"
auto_last_commit: "${lastCommit || now}"
auto_activity: ${JSON.stringify(activity || [])}
install_command: "${installCommand}"
repo_path: "${skill.repoPath}"
dependencies: ${dependencies || "[]"}
---

${skill.description}
`;
}

function main() {
  const args = process.argv.slice(2);
  let skillsDir: string;

  const localIdx = args.indexOf("--local");
  if (localIdx >= 0 && args[localIdx + 1]) {
    skillsDir = resolve(args[localIdx + 1]);
  } else {
    skillsDir = resolve(import.meta.dirname, "../../../../claude-skills");
  }

  if (!existsSync(skillsDir)) {
    console.error(`Skills directory not found: ${skillsDir}`);
    process.exit(1);
  }

  console.log(`Syncing from: ${skillsDir}`);
  console.log(`Writing to: ${CONTENT_DIR}\n`);

  const dirs = readdirSync(skillsDir).filter((d) => {
    if (SKIP_DIRS.has(d)) return false;
    const full = join(skillsDir, d);
    return statSync(full).isDirectory() && existsSync(join(full, "SKILL.md"));
  });

  console.log("Computing weekly activity...");
  const weeklyActivity = getWeeklyActivity(skillsDir);
  console.log("Getting last commit dates...");
  const commitDates = getLastCommitDates(skillsDir);

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const dir of dirs.sort()) {
    const skillMd = readFileSync(join(skillsDir, dir, "SKILL.md"), "utf-8");
    const skill = parseSkillMd(skillMd, dir);
    if (!skill) {
      console.log(`  ⚠ ${dir}: could not parse SKILL.md`);
      continue;
    }

    const existing = loadExistingMdx(dir);
    const activity = weeklyActivity[dir] || [];
    const lastCommit = commitDates[dir];
    const mdx = generateMdx(skill, existing, activity, lastCommit);
    const outPath = join(CONTENT_DIR, `${dir}.mdx`);

    if (existsSync(outPath)) {
      const current = readFileSync(outPath, "utf-8");
      if (current === mdx) {
        unchanged++;
        continue;
      }
      updated++;
      console.log(`  ✏ ${dir}`);
    } else {
      created++;
      console.log(`  ✚ ${dir}`);
    }

    writeFileSync(outPath, mdx);
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Unchanged: ${unchanged}`);
}

main();
