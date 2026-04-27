import fs from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.ELEVENLABS_API_KEY;
const outputPath = process.argv[2] || "public/audio/apothecary-square-ambience.mp3";
const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";
const endpoint = new URL("https://api.elevenlabs.io/v1/sound-generation");

endpoint.searchParams.set("output_format", outputFormat);

const prompt = [
  "A seamless thirty second ambient soundscape for an interactive medieval apothecary interior looking out onto an old European town square.",
  "Distant market murmur, soft indistinct voices, leather shoes on stone, an occasional cart wheel, a far church bell, a wooden door creak, faint glass and brass objects in a quiet shop.",
  "Warm, natural, historically grounded, intimate, not cinematic, no music, no modern vehicles, no readable speech, no sudden loud events.",
].join(" ");

if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY. Set it in the environment, then rerun this script.");
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
