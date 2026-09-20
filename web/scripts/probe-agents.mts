/**
 * Text probes against the live agents via ElevenLabs' conversation simulation.
 * Prints the agent's reply to each scripted user line so prompt/KB changes can
 * be checked without a microphone.
 *
 *   npx tsx scripts/probe-agents.mts              # both agents
 *   npx tsx scripts/probe-agents.mts guidance     # one agent
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { ConversationHistoryTranscriptCommonModelInput as Turn } from "@elevenlabs/elevenlabs-js/api";

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(webDir, ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });

// Each probe: prior turns (agent/user alternating) — the agent then answers the last user line.
const PROBES: Record<string, { envVar: string; cases: { name: string; user: string[] }[] }> = {
  guidance: {
    envVar: "ELEVENLABS_AGENT_ID_GUIDANCE",
    cases: [
      { name: "Farbsystem", user: ["Welches Tuch nehme ich für die Küche?"] },
      { name: "Falsches Tuch", user: ["Ich wisch die Spüle jetzt mit dem roten Lappen."] },
      { name: "Einstieg mitten im Ablauf", user: ["Schlafzimmer eins ist fertig, was jetzt?"] },
      { name: "Nächster Schritt", user: ["Ich will eine neue Reinigung starten.", "Ok, Material ist vorbereitet, weiter."] },
      { name: "Betriebsdaten", user: ["Welches Waschprogramm nehme ich für die Handtücher?"] },
      { name: "Schaden", user: ["Ich hab einen Wasserfleck an der Decke im Bad."] },
      { name: "Separates WC", user: ["Was muss alles im separaten WC sein?"] },
      { name: "Türkisch", user: ["Mutfak için hangi bezi kullanmalıyım?"] },
      { name: "Slowakisch", user: ["Spálňa jeden je hotová, čo teraz?"] },
      { name: "Ungarisch", user: ["Vízfoltot találtam a fürdőszoba mennyezetén."] },
    ],
  },
  onboarding: {
    envVar: "ELEVENLABS_AGENT_ID_ONBOARDING",
    cases: [
      { name: "Erste Antwort", user: ["Zwei Schlafzimmer, maximal sechs Leute, mit Terrasse."] },
      { name: "Weiß nicht", user: ["Zwei Schlafzimmer, sechs Leute.", "Ja, Farben nehmen wir genauso.", "Waschprogramm weiß ich ehrlich gesagt nicht."] },
      { name: "Abschweifen", user: ["Zwei Schlafzimmer.", "Beim Check-in erklären wir den Gästen immer die Skipässe, soll ich das auch erzählen?"] },
      { name: "Ungarisch", user: ["Két hálószoba, legfeljebb hat fő, terasszal."] },
    ],
  },
};

const only = process.argv[2];
for (const [agent, spec] of Object.entries(PROBES)) {
  if (only && only !== agent) continue;
  const agentId = process.env[spec.envVar]?.trim();
  if (!agentId) {
    console.warn(`! ${agent}: ${spec.envVar} not set`);
    continue;
  }
  const cfg = await client.conversationalAi.agents.get(agentId);
  const first = cfg.conversationConfig.agent?.firstMessage ?? "";
  console.log(`\n═══ ${agent} (${cfg.name}) ═══`);

  for (const c of spec.cases) {
    // history = first message, then user lines with a neutral agent turn between them;
    // the simulator continues from there, so the next turn is the agent's real reply.
    const history: Turn[] = [{ role: "agent", message: first, timeInCallSecs: 0 }];
    c.user.forEach((u, i) => {
      if (i > 0) history.push({ role: "agent", message: "Verstanden.", timeInCallSecs: i * 10 - 5 });
      history.push({ role: "user", message: u, timeInCallSecs: i * 10 });
    });
    const res = await client.conversationalAi.agents.simulateConversation(agentId, {
      simulationSpecification: {
        simulatedUserConfig: {
          firstMessage: c.user[c.user.length - 1],
          language: "de",
          prompt: { prompt: "Du bist der Mensch in diesem Gespräch. Antworte nur mit 'ok'." },
        },
        partialConversationHistory: history,
      },
      // a language switch costs two tool turns before the spoken reply
      newTurnsLimit: 3,
    });
    const turns = res.simulatedConversation.slice(history.length);
    const reply = turns.find((t) => t.role === "agent" && t.message)?.message;
    const switched = turns
      .flatMap((t) => t.toolCalls ?? [])
      .find((tc) => tc.toolName === "language_detection");
    console.log(`\n▸ ${c.name}\n  👤 ${c.user[c.user.length - 1]}`);
    if (switched) console.log(`  ⇄ language_detection ${switched.paramsAsJson}`);
    console.log(`  🤖 ${reply ?? "(no agent turn)"}`);
  }
}
