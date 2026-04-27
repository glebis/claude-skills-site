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
const outputPath = process.argv[2] || "public/audio/apothecary-square-ambience.mp3";
const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";
const endpoint = new URL("https://api.elevenlabs.io/v1/sound-generation");

endpoint.searchParams.set("output_format", outputFormat);

const prompt = [
  "A seamless thirty second ambient soundscape for an interactive medieval apothecary interior with open doors onto an old European town square.",
  "Clear leather footsteps on stone paving should be audible every few seconds, with gentle market bustle and soft indistinct voices outside.",
  "Add occasional wooden cart wheels, a far church bell, a wooden door creak, faint glass bottles and brass tools inside the shop.",
  "Warm, natural, historically grounded, intimate, realistic field recording style. No music, no modern vehicles, no machinery, no readable speech, no sudden loud events, no white noise hiss.",
].join(" ");

if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY or XI_API_KEY. Set it in .env.local, .env, or the shell, then rerun this script.");
  process.exit(1);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "xi-api-key": apiKey,
  },
  body: JSON.stringify({
    text: prompt,
    loop: true,
    duration_seconds: 30,
    prompt_influence: 0.45,
    model_id: "eleven_text_to_sound_v2",
  }),
});

if (!response.ok) {
  const message = await response.text();
  throw new Error(`ElevenLabs request failed: ${response.status} ${response.statusText}\n${message}`);
}

const audio = Buffer.from(await response.arrayBuffer());
const absoluteOutputPath = path.resolve(outputPath);

await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
await fs.writeFile(absoluteOutputPath, audio);

console.log(`Wrote ${outputPath} (${Math.round(audio.length / 1024)} KB)`);
