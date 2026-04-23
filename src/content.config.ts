import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const skills = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/skills" }),
  schema: z.object({
    name: z.string(),
    tagline: z.string().default(""),
    apothecary_name: z.string().default(""),
    bundle: z.string().default("uncategorized"),
    tags: z.array(z.string()).default([]),
    accent_color: z.string().default("amber"),
    hero_image: z.string().optional(),

    auto_description: z.string().default(""),
    auto_triggers: z.array(z.string()).default([]),
    auto_tools: z.array(z.string()).default([]),
    auto_activity: z.array(z.number()).default([]),
    auto_last_commit: z.string().optional(),
    auto_last_synced: z.string().optional(),

    install_command: z.string().default(""),
    repo_path: z.string().default(""),
    dependencies: z.array(z.string()).default([]),
  }),
});

const bundles = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/bundles" }),
  schema: z.object({
    name: z.string(),
    roman: z.string(),
    apothecary_name: z.string(),
    tagline: z.string(),
    accent_color: z.string(),
    hero_image: z.string().optional(),
    ancient_image: z.string().optional(),
    skills: z.array(z.string()),
    order: z.number().default(0),
  }),
});

export const collections = { skills, bundles };
