/**
 * Sync ../knowledge/ into ElevenLabs: upload the docs as text documents,
 * attach them to the agents named in knowledge/manifest.json with the right
 * usage mode, set system prompt + first message, enable RAG.
 *
 *   npx tsx scripts/sync-knowledge.mts            # all agents, placeholder Betriebsdaten
 *   npx tsx scripts/sync-knowledge.mts --demo     # use betriebsdaten.demo.md
 *   npx tsx scripts/sync-knowledge.mts --agent guidance
 *   npx tsx scripts/sync-knowledge.mts --create-missing   # create agents whose env var is unset
 *
 * Reads ELEVENLABS_API_KEY and the per-agent id env vars from web/.env.
 * Agents are created in the dashboard once; this script never creates them.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type {
  DocumentUsageModeEnum,
  EmbeddingModelEnum,
  KnowledgeBaseLocator,
} from "@elevenlabs/elevenlabs-js/api";

type DocEntry =
  | { path: string; usageMode: DocumentUsageModeEnum; demoPath?: string }
  | { glob: string; usageMode: DocumentUsageModeEnum };

type Manifest = {
  namePrefix: string;
  embeddingModel: EmbeddingModelEnum;
  agents: Record<
    string,
    {
      displayName: string;
      envVar: string;
      fallbackEnvVar?: string;
      cloneFrom?: string; // agent key whose voice/LLM/security config a new agent copies
      systemPrompt: string;
      firstMessage: string;
      docs: DocEntry[];
    }
  >;
};

type ResolvedDoc = {
  name: string;
  relPath: string;
  usageMode: DocumentUsageModeEnum;
  text: string;
};

const here = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(here, "..");
const knowledgeDir = resolve(webDir, "..", "knowledge");

const args = process.argv.slice(2);
const demo = args.includes("--demo");
const createMissing = args.includes("--create-missing");
const agentFilter = args.includes("--agent")
  ? args[args.indexOf("--agent") + 1]
  : undefined;

const envPath = join(webDir, ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
if (!apiKey) fail("Missing ELEVENLABS_API_KEY in web/.env");

const manifest: Manifest = JSON.parse(
  readFileSync(join(knowledgeDir, "manifest.json"), "utf8")
);
const client = new ElevenLabsClient({ apiKey });

// --- resolve manifest → list of docs per agent -----------------------------

function docName(relPath: string): string {
  return `${manifest.namePrefix}/${relPath.replace(/\.md$/, "")}`;
}

function expandEntry(entry: DocEntry): ResolvedDoc[] {
  if ("glob" in entry) {
    // only "<dir>/*.md" is supported — enough for the prozesse folder
    const dir = dirname(entry.glob);
    return readdirSync(join(knowledgeDir, dir))
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => loadDoc(join(dir, f), entry.usageMode));
  }
  const rel = demo && entry.demoPath ? entry.demoPath : entry.path;
  // demo variant is published under the canonical name so the agent
  // always sees exactly one "betriebsdaten" doc
  return [loadDoc(rel, entry.usageMode, docName(entry.path))];
}

function loadDoc(
  relPath: string,
  usageMode: DocumentUsageModeEnum,
  name = docName(relPath)
): ResolvedDoc {
  return {
    name,
    relPath,
    usageMode,
    text: readFileSync(join(knowledgeDir, relPath), "utf8"),
  };
}

const agentNames = Object.keys(manifest.agents).filter(
  (n) => !agentFilter || n === agentFilter
);
if (agentNames.length === 0) fail(`Unknown agent "${agentFilter}"`);

const perAgent = new Map<string, ResolvedDoc[]>();
const byName = new Map<string, ResolvedDoc>(); // dedupe shared docs
for (const agent of agentNames) {
  const docs = manifest.agents[agent].docs.flatMap(expandEntry);
  perAgent.set(agent, docs);
  for (const d of docs) byName.set(d.name, d);
}

// --- 1. find previously synced docs (by name prefix) -----------------------

async function listOurDocs() {
  const found: { id: string; name: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await client.conversationalAi.knowledgeBase.list({
      pageSize: 100,
      types: "text",
      cursor,
    });
    for (const d of page.documents) {
      if (d.name.startsWith(`${manifest.namePrefix}/`)) {
        found.push({ id: d.id, name: d.name });
      }
    }
    cursor = page.hasMore ? page.nextCursor : undefined;
  } while (cursor);
  return found;
}

const previous = await listOurDocs();
console.log(`Found ${previous.length} previously synced docs`);

// --- 2. upload fresh copies ------------------------------------------------

const uploaded = new Map<string, string>(); // name → id
for (const doc of byName.values()) {
  const res = await client.conversationalAi.knowledgeBase.documents.createFromText(
    { name: doc.name, text: doc.text }
  );
  uploaded.set(doc.name, res.id);
  console.log(`  ↑ ${doc.name}  (${doc.usageMode})  ${res.id}`);
}

// --- 3. point each agent at the new docs -----------------------------------

function envAgentId(agent: string): string | undefined {
  const cfg = manifest.agents[agent];
  return (
    process.env[cfg.envVar]?.trim() ||
    (cfg.fallbackEnvVar ? process.env[cfg.fallbackEnvVar]?.trim() : undefined)
  );
}

// Create an agent by copying voice/LLM/TTS/security settings from a sibling,
// so both agents sound and behave the same apart from prompt + knowledge.
async function createAgent(agent: string): Promise<string> {
  const cfg = manifest.agents[agent];
  const sourceId = cfg.cloneFrom ? envAgentId(cfg.cloneFrom) : undefined;
  if (!sourceId) {
    fail(`${agent}: cannot create — cloneFrom agent "${cfg.cloneFrom}" has no id in env`);
  }
  const src = await client.conversationalAi.agents.get(sourceId);
  const res = await client.conversationalAi.agents.create({
    name: cfg.displayName,
    conversationConfig: src.conversationConfig,
    platformSettings: src.platformSettings,
  });
  console.log(`+ created agent "${cfg.displayName}" → ${res.agentId}`);
  console.log(`  add to web/.env:  ${cfg.envVar}=${res.agentId}`);
  return res.agentId;
}

for (const agent of agentNames) {
  const cfg = manifest.agents[agent];
  let agentId = envAgentId(agent);
  if (!agentId && createMissing) agentId = await createAgent(agent);
  if (!agentId) {
    console.warn(`! ${agent}: ${cfg.envVar} not set — skipping (use --create-missing to create it)`);
    continue;
  }
  const docs = perAgent.get(agent)!;
  const knowledgeBase: KnowledgeBaseLocator[] = docs.map((d) => ({
    type: "text",
    id: uploaded.get(d.name)!,
    name: d.name,
    usageMode: d.usageMode,
  }));

  // merge into the existing config so LLM/voice settings from the dashboard survive
  const current = await client.conversationalAi.agents.get(agentId);
  const prompt = current.conversationConfig.agent?.prompt ?? {};
  await client.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      agent: {
        ...current.conversationConfig.agent,
        language: "de",
        firstMessage: readFileSync(join(knowledgeDir, cfg.firstMessage), "utf8").trim(),
        prompt: {
          ...prompt,
          prompt: readFileSync(join(knowledgeDir, cfg.systemPrompt), "utf8"),
          knowledgeBase,
          rag: {
            ...prompt.rag,
            enabled: true,
            embeddingModel: manifest.embeddingModel,
          },
        },
      },
    },
  });
  console.log(`✓ ${agent} (${agentId}): ${knowledgeBase.length} docs attached`);
}

// --- 4. kick off RAG indexing for auto-mode docs ---------------------------

for (const doc of byName.values()) {
  if (doc.usageMode !== "auto") continue;
  const id = uploaded.get(doc.name)!;
  try {
    const r = await client.conversationalAi.knowledgeBase.document.computeRagIndex(
      id,
      { model: manifest.embeddingModel }
    );
    console.log(`  ⟳ rag ${doc.name}: ${r.status}`);
  } catch (e) {
    console.warn(`  ! rag ${doc.name}: ${(e as Error).message}`);
  }
}

// --- 5. remove the stale copies (now detached) -----------------------------

if (agentFilter) {
  console.log(
    "--agent given: leaving old docs in place (they may still be attached to the other agent)"
  );
} else {
  const newIds = new Set(uploaded.values());
  for (const old of previous) {
    if (newIds.has(old.id)) continue;
    try {
      await client.conversationalAi.knowledgeBase.documents.delete(old.id, {
        force: true,
      });
      console.log(`  ✕ removed old ${old.name} (${old.id})`);
    } catch (e) {
      console.warn(`  ! could not delete ${old.name}: ${(e as Error).message}`);
    }
  }
}

console.log(demo ? "\nDone (demo Betriebsdaten)." : "\nDone (placeholder Betriebsdaten).");

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}
