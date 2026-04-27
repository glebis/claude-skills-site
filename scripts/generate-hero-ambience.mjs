import fs from "node:fs/promises";
import path from "node:path";

const loadEnvFile = async (filePath) => {
  try {
    const env = await fs.readFile(filePath, "utf8");

    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;

      const [, key, rawValue] = match;
      if (process.env[key]) continue;

      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

await loadEnvFile(".env.local");
await loadEnvFile(".env");

const apiKey = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
const outputDir = process.argv[2] || "public/audio/hero";
const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";
const endpoint = new URL("https://api.elevenlabs.io/v1/sound-generation");

endpoint.searchParams.set("output_format", outputFormat);

const tracks = [
  {
    file: "square-market.mp3",
    prompt: "Seamless 30s old European town square ambience outside an apothecary door. Soft indistinct human voices, market murmur, leather footsteps on stone, cart wheels on cobbles, distant church bell. Natural field recording, no music, no modern sounds, no clear words, no hiss.",
    influence: 0.62,
  },
  {
    file: "shop-clock.mp3",
    prompt: "Seamless 30s interior medieval apothecary clock. Warm old mechanical clock ticking steadily with subtle wooden case resonance, very occasional tiny gear movement. Close indoor sound, intimate, no music, no voices, no hiss, no alarm.",
    influence: 0.58,
  },
  {
    file: "wood-creaks.mp3",
    prompt: "Seamless 30s old apothecary wood ambience. Slow irregular wooden floorboard creaks, faint settling beams, quiet door hinge creak, warm room tone. Natural close indoor recording, sparse and believable, no footsteps, no music, no hiss.",
    influence: 0.6,
  },
  {
    file: "shelf-glass.mp3",
    prompt: "Seamless 30s apothecary shelf details. Tiny glass bottles lightly clinking, brass tools shifting, mortar and pestle touches, subtle ceramic taps in a quiet wooden shop. Close realistic foley, sparse, no voices, no music, no hiss.",
    influence: 0.6,
  },
];

if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY or XI_API_KEY. Set it in .env.local, .env, or the shell, then rerun this script.");
  process.exit(1);
}

const absoluteOutputDir = path.resolve(outputDir);

await fs.mkdir(absoluteOutputDir, { recursive: true });

for (const track of tracks) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: track.prompt,
      loop: true,
      duration_seconds: 30,
      prompt_influence: track.influence,
      model_id: "eleven_text_to_sound_v2",
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`ElevenLabs request failed for ${track.file}: ${response.status} ${response.statusText}\n${message}`);
  }

  const audio = Buffer.from(await response.arrayBuffer());
  const outputPath = path.join(absoluteOutputDir, track.file);

  await fs.writeFile(outputPath, audio);
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)} (${Math.round(audio.length / 1024)} KB)`);
}
