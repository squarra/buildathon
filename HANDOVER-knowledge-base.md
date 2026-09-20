# Handover — Knowledge base and RAG for the ElevenLabs agents

**For:** the next agent (or human) continuing the knowledge-base work
**Repo:** `buildathon26`, branch `voice-feature`
**State verified live on 2026-09-20 (read-only API calls):** 25 documents uploaded, both agents wired, all 20 RAG indexes `succeeded`, **demo** Betriebsdaten currently live.

Related docs: `knowledge/README.md` (short operator guide), `PROJECT.md` (product context), `HANDOVER-voice-web.md` (the web client). This file goes deeper on the data, its structure, how ElevenLabs RAG actually behaves, and what to touch when.

> Not to be confused with `../buildathon` (branch `map-feature`, the "Saisonwissen" app with the floor-plan/pin feature). That is a separate repo forked from this one's `3539f32`. It plans its *own* ElevenLabs voice guidance and does **not** use this knowledge base. If the two are supposed to share one agent, that is an open decision — see §9.

---

## 1. Where everything lives

```
buildathon26/
├── notes/Housekeeping_Handbuch_MountainChalets_Fiss.md   ← SOURCE OF TRUTH (handbook, ~§1–§12)
├── knowledge/                                            ← agent-ready derivative (German)
│   ├── manifest.json                                     ← what goes to which agent in which mode
│   ├── README.md
│   ├── shared/regeln-und-farbsystem.md
│   ├── guidance/{system-prompt,first-message,ablauf-uebersicht,betriebsdaten,betriebsdaten.demo,qualitaet-und-meldung}.md
│   ├── guidance/prozesse/01-…19-*.md                     ← one file per process
│   └── onboarding/{system-prompt,first-message,prozess-vorlage,interviewleitfaden,data-collection}.md
└── web/
    ├── .env                                              ← ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, _GUIDANCE, _ONBOARDING
    └── scripts/
        ├── sync-knowledge.mts                            ← npm run sync-kb   (push knowledge/ → ElevenLabs)
        └── probe-agents.mts                              ← npm run probe     (text-simulate the live agents)
```

Nothing in `knowledge/` or `web/` is committed yet (`git status`: untracked). `.gitignore` is 5 bytes — check it covers `.env` and `web/.env` before the first commit.

## 2. The data

### 2.1 Origin and editorial rules

Everything derives from the handbook in `notes/`. The derivative in `knowledge/` was produced under these rules (keep them when editing):

- **De-branded**: no chalet/company names, no website references.
- **No document meta**: approval fields, version status, "Handbuchpflege" left out (handbook §1, §2.2, §9, §10, §12-approval).
- **Checklists → sentences**: the agent *speaks* this; tables only in the always-on rules doc.
- **Nothing invented**: every handbook item marked "zu bestätigen" is written as `noch nicht festgelegt`. The agent is instructed to say exactly that instead of guessing.
- **German throughout**; guidance agent uses *du*, onboarding agent uses *Sie*.
- Each `auto` document covers **one retrieval topic** (one process) so a RAG hit lands cleanly.

### 2.2 Inventory (30 files, ~6 200 words)

| File | Words | Agent | Mode | Handbook § | Content |
|---|---|---|---|---|---|
| `shared/regeln-und-farbsystem.md` | 325 | both | prompt | §3, §4 | 10 Arbeitsregeln; colour system (Blau=Schlafen/Wohnen, Grün=Küche, Gelb=Bad, Rot=WC) with hard prohibitions; Materialstation |
| `guidance/system-prompt.md` | 499 | guidance | system prompt | – | persona, speaking style, step-by-step procedure, rules enforced, honesty rule, closing |
| `guidance/first-message.md` | 16 | guidance | first message | – | greeting: new cleaning or a question? |
| `guidance/ablauf-uebersicht.md` | 352 | guidance | prompt | §6 titles, §11 | the 19 processes in fixed order, 3 phases, sequencing rules |
| `guidance/betriebsdaten.md` | 270 | guidance | prompt | §2.3, §12 | ~25 site-specific values, all `noch nicht festgelegt` |
| `guidance/betriebsdaten.demo.md` | 356 | guidance | prompt (`--demo`) | dito | same keys, plausible demo values, header says "Demo-Werte, nicht betrieblich bestätigt" |
| `guidance/qualitaet-und-meldung.md` | 312 | guidance | auto | §5, §7, §8, P19 | "fertig" definition, report-immediately list, report contents, forbidden actions, do-not-release criteria, roles |
| `guidance/prozesse/01…19-*.md` | 57–189 each | guidance | auto | §6 P1–P19 | one process each, see schema below |
| `onboarding/system-prompt.md` | 325 | onboarding | system prompt | – | persona (Berater, *Sie*), one question at a time, mirror answers, propose-then-confirm, handle "weiß nicht", stay on topic |
| `onboarding/first-message.md` | 35 | onboarding | first message | – | greeting |
| `onboarding/prozess-vorlage.md` | 555 | onboarding | prompt | §6 compressed | shared principles + the 19 processes each with "Varianten je Betrieb" |
| `onboarding/interviewleitfaden.md` | 440 | onboarding | prompt | §2.3, §12 as questions | 11 topics, each = standard + confirm questions; closing summary |
| `onboarding/data-collection.md` | 391 | onboarding | **manual in dashboard** | §2.3, §12 as fields | 25 extraction fields (name, type, description) |
| `manifest.json` | – | – | control file | – | see §5 |

### 2.3 Document shapes (informal schemas)

**Process document** (`guidance/prozesse/NN-slug.md`, all 19 follow this):

```
# Prozess N: <Titel>
<1–2 sentences: purpose, which colour material, what is deferred to another process>

## <Sub-area or "Schritte">        (0–3 sections; e.g. "Dusche … mit gelben Materialien", "WC … mit roten Materialien")
1. <imperative step>
2. …

## Auffüllen                        (optional; bullet list of what to restock)

## Qualitätsstandard                (always last; bullet list or one sentence)
```

Steps are ordered and numbered inside a file; the *cross-process* order comes only from `ablauf-uebersicht.md`. Colour is repeated inside each process doc on purpose — a RAG chunk must be self-sufficient.

**Betriebsdaten** (`betriebsdaten*.md`) — flat key/value under 8 headings:

```
## Wohnung | Wäsche und Textilien | Reinigungsmittel | Küche | Bad und WC | Müll | Fenster | Zuständigkeiten
- <Key>: <value | noch nicht festgelegt>.
```

Every key corresponds 1:1 to a row in `onboarding/data-collection.md` and to a topic in `onboarding/interviewleitfaden.md`. Keep the three in sync when adding a key.

**Data-collection field** (`onboarding/data-collection.md`) — table row: `snake_case_name | string|number|boolean | extraction instruction`. The description is what the LLM uses after the call to extract the value; empty if the topic was not discussed or was marked open.

### 2.4 The apartment model baked in

All docs assume one unit type: *2 Schlafzimmer, offener Wohn-/Essbereich mit Küche, Bad mit Dusche + WC, separates WC, (Terrasse)*. There is no multi-unit or per-room data model — "which apartment" is not a concept yet. If you need several units, that is a schema change (see §9).

## 3. How ElevenLabs knowledge base + RAG work (as used here)

Facts below come from the installed SDK types (`web/node_modules/@elevenlabs/elevenlabs-js/api/types/*`) and the live agent config, not from memory.

**Account-level documents.** `knowledgeBase.documents.createFromText({name, text})` creates a *text document* owned by the account (not by an agent). Ours are named `hk/<path-without-.md>`, e.g. `hk/guidance/prozesse/11-badezimmer`. The demo Betriebsdaten is uploaded under the canonical name `hk/guidance/betriebsdaten` so an agent always sees exactly one Betriebsdaten doc.

**Attachment with a usage mode.** An agent's `conversationConfig.agent.prompt.knowledgeBase` is a list of `KnowledgeBaseLocator {type:"text", id, name, usageMode}`. `usageMode` is one of:

- `prompt` — the **full document text is injected into the system prompt on every turn**. No retrieval, no chunking, always present. Cost: context tokens every turn. Used for anything where order or safety matters.
- `auto` — the document is only available through **RAG**: chunked, embedded, and retrieved per turn by similarity.

**RAG configuration** lives in `prompt.rag` (`RagConfigInput`). Live values on both agents (defaults; the sync script only sets `enabled` and `embeddingModel`):

| Field | Live value | Meaning |
|---|---|---|
| `enabled` | `true` | RAG on |
| `embeddingModel` | `multilingual_e5_large_instruct` | multilingual embedding — chosen because the data is German (alternative: `e5_mistral_7b_instruct`) |
| `maxVectorDistance` | `0.6` | chunks farther than this are dropped |
| `maxRetrievedRagChunksCount` | `20` | cap on chunks injected per turn |
| `maxDocumentsLength` | `50000` | cap on characters of retrieved text injected per turn |
| `numCandidates` | (default) | ANN candidates before ranking |
| `queryRewritePromptOverride` | (unset) | ElevenLabs rewrites the conversation into a retrieval query; can be overridden |

**Indexing.** Each `auto` document needs an index per embedding model: `knowledgeBase.document.computeRagIndex(docId, {model})`. It is idempotent — calling it again returns the existing index with its `status` (`new | created | processing | succeeded | failed | rag_limit_exceeded | document_too_small | cannot_index_folder`). All 20 of ours are `succeeded`; the smallest (`18-materialien-entfernen`, 474 chars) indexed fine, so `document_too_small` is not a concern at this size. Indexing runs asynchronously after the sync; a probe immediately after a sync may still miss fresh chunks.

**Per-turn behaviour (guidance agent).** Every turn the model sees:

1. The system prompt (`guidance/system-prompt.md`).
2. The three `prompt` docs verbatim: rules + colour system, process order, Betriebsdaten (~950 words together).
3. Up to 20 chunks (≤ 50 000 chars) from the 20 `auto` docs whose embedding is within distance 0.6 of a query derived from the recent conversation.
4. Conversation history.

Retrieval details are stored on each conversation (`RagRetrievalInfo`: `retrievalQuery`, `chunks[{documentId, chunkId, vectorDistance}]`, `usedChunkIds`, `ragLatencySecs`) — visible in the dashboard under Conversations → the call → RAG, and the best place to debug "why did it say that".

**Onboarding agent** has RAG enabled but **no `auto` docs**, so retrieval never returns anything; it works purely from prompt-injected docs. That is intentional: the interview must follow a fixed script.

## 4. How the agents interact with the data

### 4.1 guidance (staff, *du*)

The system prompt names the documents explicitly and tells the model how to use each:

| Prompt instruction | Data it relies on |
|---|---|
| "führst du entlang der Ablaufübersicht durch die 19 Prozesse, in dieser Reihenfolge" | `ablauf-uebersicht.md` (prompt) — order comes from here, never from RAG |
| "Die einzelnen Schritte holst du aus dem jeweiligen Prozessdokument in der Wissensdatenbank" | `prozesse/NN-*.md` (auto) — step detail is retrieved once the process is named |
| "gib immer nur einen Schritt vor … bei einem neuen Prozess Prozessname, Tuchfarbe, erster Schritt" | process doc structure (numbered steps, colour in header) |
| colour-system enforcement, "korrigierst du freundlich" | `regeln-und-farbsystem.md` (prompt) |
| damage / Feuchtigkeit / Fundstücke → report, what to include, whether release is blocked | `qualitaet-und-meldung.md` (auto) |
| "Konkrete Werte … stehen im Dokument Betriebsdaten. Steht dort 'noch nicht festgelegt', sagst du genau das" | `betriebsdaten.md` (prompt) |
| mid-flow entry ("Schlafzimmer eins ist fertig") | `ablauf-uebersicht.md` to locate position, then RAG for the next process |

Design consequence: **the retrieval query is only as good as the process name in the conversation.** If the user says "das Zimmer ist fertig" without naming it, the agent has to ask. The prompt covers this ("frag kurz nach, statt zu raten").

### 4.2 onboarding (owner, *Sie*)

Runs the 11-topic `interviewleitfaden.md` top to bottom, proposing the standard from `prozess-vorlage.md` first ("üblich ist X — ist das bei Ihnen auch so?"). Answers are meant to be captured by **Data Collection** (Agent → Analysis → Data collection in the dashboard) into the 25 fields of `data-collection.md`. After a call the values appear under Conversations → Analysis.

### 4.3 The loop between them (manual today)

```
Owner ──voice──► onboarding agent ──► Data-Collection fields (25)
                                              │   by hand
                                              ▼
                              guidance/betriebsdaten.md  ──npm run sync-kb──►  guidance agent ──voice──► staff
```

Each field name maps to one Betriebsdaten line. Automating this hop (fetch conversation analysis → render `betriebsdaten.md` → sync) is the obvious next feature; nothing exists for it yet.

## 5. The sync pipeline (`web/scripts/sync-knowledge.mts`)

Driven by `knowledge/manifest.json`:

```json
{ "namePrefix": "hk",
  "embeddingModel": "multilingual_e5_large_instruct",
  "agents": {
    "guidance":   { "displayName", "envVar": "ELEVENLABS_AGENT_ID_GUIDANCE", "fallbackEnvVar": "ELEVENLABS_AGENT_ID",
                    "systemPrompt", "firstMessage",
                    "docs": [ {"path", "usageMode", "demoPath"?} | {"glob": "guidance/prozesse/*.md", "usageMode"} ] },
    "onboarding": { …, "cloneFrom": "guidance", … } } }
```

Steps, in order:

1. Resolve manifest → per-agent doc list; `glob` supports only `<dir>/*.md`; with `--demo`, entries with `demoPath` load that file but publish under the canonical `path` name. Shared docs are deduplicated by name.
2. List existing KB text docs whose name starts with `hk/` (paginated).
3. Upload **fresh copies** of every doc (`createFromText`). Old ones stay for now.
4. Per agent: `agents.get` → `agents.update` merging into the existing config: sets `language: "de"`, `firstMessage`, `prompt.prompt` (system prompt), `prompt.knowledgeBase` (the locators with modes), `prompt.rag.enabled=true` + `embeddingModel`. **Everything else (LLM, voice, TTS, security, tools, client events, data collection) is preserved** because it spreads `...current.conversationConfig.agent` and `...prompt`.
   - `--create-missing`: if an agent's env var is unset, creates it by copying `conversationConfig` + `platformSettings` from the `cloneFrom` agent and prints the new id to add to `web/.env`.
5. `computeRagIndex` for every `auto` doc.
6. Delete the previously found `hk/` docs that are not among the new ids (`force: true`). **Skipped when `--agent X` is given**, because the old docs may still be attached to the other agent — so after a single-agent sync, orphans accumulate until the next full sync.

Flags: `--demo`, `--agent guidance|onboarding`, `--create-missing`. Env from `web/.env` via `process.loadEnvFile` (needs Node ≥ 20.12).

Things the script deliberately does **not** do: set `displayName` on existing agents (the live guidance agent is still called "buildathon26 Hospitality Assistant"), touch RAG retrieval limits, create data-collection fields, set the domain allowlist.

## 6. Live state (verified 2026-09-20)

| | guidance | onboarding |
|---|---|---|
| Name in dashboard | buildathon26 Hospitality Assistant | Housekeeping – Onboarding (Inhaber) |
| Agent id | `ELEVENLABS_AGENT_ID_GUIDANCE` in `web/.env` (`agent_7801…`) | `ELEVENLABS_AGENT_ID_ONBOARDING` (`agent_2101…`) |
| LLM | `claude-sonnet-4-5` | `claude-sonnet-4-5` |
| Language | de | de |
| `prompt` docs | regeln-und-farbsystem, ablauf-uebersicht, betriebsdaten (**demo variant**) | regeln-und-farbsystem, prozess-vorlage, interviewleitfaden |
| `auto` docs | qualitaet-und-meldung + 19 prozesse (all indexed `succeeded`) | none |
| RAG | on, e5-multilingual, defaults (0.6 / 20 chunks / 50 000 chars) | same |

25 `hk/` text docs exist in the account, no orphans. Whether the 25 data-collection fields have been created in the dashboard was **not** verified — check Agent → Analysis before relying on onboarding output.

## 7. Testing (`web/scripts/probe-agents.mts`)

`npm run probe [guidance|onboarding]` uses `agents.simulateConversation` with `partialConversationHistory` (first message + scripted user lines, "Verstanden." as filler agent turns) and `newTurnsLimit: 1`, then prints the agent's real reply. Cases: Farbsystem, falsches Tuch, Einstieg mitten im Ablauf, nächster Schritt, Betriebsdaten, Schaden, separates WC; onboarding: erste Antwort, "weiß nicht", Abschweifen. Text-only, so it tests prompt + RAG, not voice. Workflow: edit → `sync-kb` → wait for indexing → `probe`.

What "good" looks like: short spoken sentences, correct colour, steps one at a time, Betriebsdaten either the demo value or "dafür gibt es noch keine Vorgabe" (never an invented number), damage → "sofort melden" + report contents + release blocked or not.

## 8. How to change things

| Want to… | Do |
|---|---|
| Change a rule / the order | edit `shared/regeln-und-farbsystem.md` or `guidance/ablauf-uebersicht.md` → `sync-kb`. These are `prompt` docs, no re-indexing needed. |
| Change steps of a process | edit `guidance/prozesse/NN-*.md` → `sync-kb` (re-uploads and re-indexes everything) → wait → `probe`. |
| Add a process | new `guidance/prozesse/20-slug.md` in the schema of §2.3 **and** add it to `ablauf-uebersicht.md` (and `onboarding/prozess-vorlage.md` if the owner should be asked about it). The glob picks it up. |
| Fill real Betriebsdaten | edit `guidance/betriebsdaten.md` (keep keys), `sync-kb` **without** `--demo`. Add a key → also add the field in `data-collection.md` and the question in `interviewleitfaden.md`. |
| Switch demo ↔ real | `sync-kb -- --demo` / `sync-kb`. Both publish as `hk/guidance/betriebsdaten`. |
| Tune retrieval | set `maxVectorDistance`, `maxRetrievedRagChunksCount`, `maxDocumentsLength` inside the `rag: {…}` object in step 4 of the script (or in the dashboard — the script preserves values it doesn't set). |
| Debug a wrong answer | dashboard → Conversations → the call → RAG retrieval info: see `retrievalQuery` and which chunk ids were used. |
| Change LLM / voice / TTS | dashboard only; the script never overwrites them. |
| Rename the guidance agent | dashboard, or add `name: cfg.displayName` to the `agents.update` call. |

## 9. Open points and risks

1. **Nothing is committed.** `knowledge/`, `web/`, both handover files are untracked. Commit soon; verify `.gitignore` excludes `.env`/`web/.env` (root `.env` currently also holds a key named `ELEVENLABS_KEY`).
2. **Data-collection fields**: creation in the dashboard is manual and unverified; the SDK's `platformSettings.dataCollection` could script it if needed.
3. **Onboarding → Betriebsdaten hop is manual.** No code fetches conversation analysis results.
4. **Single apartment type.** No unit/room ids, no multi-property model. The `../buildathon` Saisonwissen app *does* model units, rooms and pins with their own processes (`p1–p4`, own step bodies) — the two data models are unrelated today. Decide whether the map's pin processes should be spoken by this guidance agent (then they need to be authored in this schema and synced) or by Saisonwissen's own agent.
5. **`--agent X` leaves stale docs** until the next full sync (by design, see §5 step 6).
6. **Indexing is async**; a probe right after sync can hit a `processing` index. The script does not wait or poll.
7. **Prompt-mode budget.** ~950 words of always-on docs for guidance is fine; if Betriebsdaten grows large (e.g. multi-unit), consider moving it to `auto` with per-unit docs, or a client/server tool that looks values up.
8. **Vercel domain allowlist** for both agents still to be set after deploy (see `HANDOVER-voice-web.md` §6).
