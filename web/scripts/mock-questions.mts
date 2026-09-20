/**
 * Generate spoken mock questions (one MP3 per language) from
 * ../mock-questions/questions.json, then transcribe each file back with
 * ElevenLabs Scribe to confirm the ASR hears it the way the agent would.
 *
 *   npx tsx scripts/mock-questions.mts            # all questions
 *   npx tsx scripts/mock-questions.mts <id>       # one question
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(webDir, "..", "mock-questions");
const envPath = join(webDir, ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });

// A different voice than the agent (Daniel) so the demo sounds like two people.
const SPEAKER_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah
const LANGS = ["de", "tr", "sk", "hu"] as const;

type Question = { id: string } & Record<(typeof LANGS)[number], string>;
const questions: Question[] = JSON.parse(readFileSync(join(outDir, "questions.json"), "utf8"));
const only = process.argv[2];

mkdirSync(outDir, { recursive: true });

for (const q of questions) {
  if (only && q.id !== only) continue;
  console.log(`\n▸ ${q.id}`);
  for (const lang of LANGS) {
    const file = join(outDir, `${q.id}.${lang}.mp3`);
    // flash v2.5 + explicit languageCode: multilingual_v2 guessed Hungarian
    // pronunciation badly enough that Scribe misheard it (round-trip test below)
    const stream = await client.textToSpeech.convert(SPEAKER_VOICE_ID, {
      text: q[lang],
      modelId: "eleven_flash_v2_5",
      languageCode: lang,
      outputFormat: "mp3_44100_128",
    });
    const audio = Buffer.from(await new Response(stream).arrayBuffer());
    writeFileSync(file, audio);

    // round-trip: does the ASR the agent uses understand this file?
    const stt = await client.speechToText.convert({
      modelId: "scribe_v1",
      file: new File([audio], `${q.id}.${lang}.mp3`, { type: "audio/mpeg" }),
    });
    const heard = "text" in stt ? stt.text : "(no transcript)";
    const detected = "languageCode" in stt ? `${stt.languageCode} ${(stt.languageProbability * 100).toFixed(0)}%` : "?";
    console.log(`  ${lang}  ${(audio.length / 1024).toFixed(0)} KB  ${file.replace(outDir + "/", "")}`);
    console.log(`      said:  ${q[lang]}`);
    console.log(`      heard: ${heard}   [${detected}]`);
  }
}
