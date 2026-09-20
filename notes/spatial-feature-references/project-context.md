# buildathon26 — Project Context

> Purpose of this file: give any agent (or human) enough context to understand what we are building at the buildathon and what to do next, without re-reading the raw notes. Sources are in `notes/` (see "Sources" at the end).

Status as of 2026-09-20: **idea stage, nothing built yet.** Repo contains only notes.

---

## 1. One-line pitch

A **voice-first assistant for small hospitality businesses** (hotels, holiday apartments / Ferienwohnungen) that captures the owner's operational processes once and then guides staff through them by voice — and keeps that knowledge base up to date over time.

## 2. Problem

- Owners / managers of small hospitality businesses carry their processes in their heads (how to clean a 2-bedroom apartment, what to tell guests at check-in, which cloth to use where…).
- New or temporary staff need to be trained repeatedly; guests ask the same questions at reception over and over.
- Existing documentation (positioning doc, guest folder / Gästemappe, FAQ) exists only in a minority of businesses.
- Processes change, and the documentation drifts out of date.

## 3. Target users

| Role | Needs |
|---|---|
| **Owner / manager (Inhaber / Leiter)** | Onboard the business quickly, capture processes by talking, keep knowledge current with minimal effort, receive feedback from staff to improve processes |
| **Staff (e.g. cleaning, reception)** | Be guided step by step through a task by voice ("start with the bathroom, use separate cloths for toilet and sink…"), give feedback after finishing a task/lesson |
| **Guests (indirect)** | Get consistent answers (a good FAQ reportedly covers ~80% of reception questions) |

## 4. Core product concepts (from the 2026-09-20 discussion)

### 4.1 Onboarding — capturing the process landscape
- First interaction after purchase: greeting — *"Welcome, we help you save time. Let's start by capturing your activities and processes."*
- **Inputs** discussed:
  - Voice from owner or specialist staff (primary; "like we're doing right now")
  - Interpretation of what was said → mapping onto a **process landscape** / deriving processes
  - Optional documents: positioning, guest folder (Gästemappe), FAQ, process documents
- **Open questions** (no decision made):
  - Modality: voice only, typing, document upload, or combination?
  - What does the UI look like? How does the user interact?
  - Should the system **propose processes** based on similar businesses ("other businesses like yours do X")?

### 4.2 Task guidance for staff
- Example given: cleaning a 2-bedroom apartment with kitchen, living room, bathroom, extra WC. The system tells the worker where to start and what to watch out for (hygiene: don't reuse the toilet cloth on the sink).
- Learning content is organised as **modules / building blocks (Bausteine)**, i.e. lessons.

### 4.3 Keeping the knowledge base current
- **Monthly check-up** (proposal, "once a month would be cool"): the system proactively asks the owner *"What changed? Typical topics are X, Y, Z — anything new? Did I understand correctly?"* → owner confirms → knowledge base updated.
- Responsibility for updates lies with the owner / manager.

### 4.4 Feedback loop
- After a staff member completes a module/lesson, the system automatically collects feedback ("how did the system help me?", problems encountered).
- Feedback goes to the owner / manager, who decides on process improvements.
- Trigger is **event-based (module completed), not time-based**.
- Open: who evaluates feedback and how improvements flow back.

### 4.5 Map feature (idea from `notes/stack.md`)
- A **floor plan / map of the hotel** with processes spatially mapped onto rooms/areas. Scope for the buildathon undecided — treat as stretch goal.

## 5. Decisions and action items

**Confirmed decisions:** none yet.

**Action items from the meeting:**
- Write user stories (one participant, via a prompt) — not yet in this repo.
- Build a proper FAQ (one participant, in progress) — real-world sample content, potentially usable as demo data.

## 6. Tech direction (from `notes/stack.md`)

Voice UI is to be built on **ElevenLabs Agents** using the official Next.js quickstart:
https://github.com/elevenlabs/examples/blob/main/agents/nextjs/quickstart/example

Why: it already keeps the API key server-side (`app/api/conversation-token` mints a short-lived token), so it works with a private agent behind a public URL — right for a demo.

What the example contains:
- `@elevenlabs/react` — `ConversationProvider`, `useConversationControls`, `useConversationStatus`: WebRTC session, mic, agent audio playback, speaking state, transcript
- `app/api/conversation-token` — server route using `ELEVENLABS_API_KEY`
- `app/api/agent` + "Create agent" form — dev convenience, **to be removed**
- Tailwind 4 + shadcn UI, Next 16

Planned steps:
1. **Scaffold** — copy just that example dir into a new sibling folder (`../voice-showcase-web` was proposed), `pnpm install`, `.env` with `ELEVENLABS_API_KEY`.
2. **Trim** — remove create-agent form and `api/agent` route; read agent ID from `ELEVENLABS_AGENT_ID` env var (server-side). Page = Start → orb / speaking indicator + transcript → Stop.
3. **Light restyle** — bigger status/speaking indicator so a jury sees who is talking; hackathon name/title. Nothing more.
4. **Deploy to Vercel** — `npx vercel`, set the two env vars, get HTTPS URL, test on a phone.

Estimate: ~1–1.5 h to a deployed URL; remaining time goes into the agent itself (prompt, knowledge base, tools).

Still to confirm: Vercel account available? Final project location (sibling folder vs. inside this repo)?

Env vars needed: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`.

## 7. Suggested demo scope (proposal, not decided)

Given hackathon time, a plausible vertical slice:
1. **Onboarding by voice** — owner describes a process (e.g. apartment cleaning); agent asks clarifying questions and produces a structured process (steps, rooms, hygiene rules).
2. **Guidance by voice** — staff member starts the task; agent walks them through step by step.
3. **Feedback** — at the end, the agent asks how it went and stores feedback for the owner.
4. Stretch: monthly check-up conversation; floor-plan map with processes attached.

Language: the team and target market are German-speaking; the agent should likely speak German (confirm).

## 8. Open questions to resolve before/while building

1. Onboarding modality: voice only vs. voice + document upload.
2. Which flows are in the demo: onboarding, staff guidance, feedback, check-up — or a subset.
3. Is the map feature in scope?
4. Vercel account / hosting; project folder location.
5. Agent language (German vs. English) and persona.
6. Where does the structured knowledge live during the demo (in-memory, JSON file, ElevenLabs knowledge base, DB)?

## 9. Sources

| Path | What it is | Relevance |
|---|---|---|
| `notes/stack.md` | Tech plan (ElevenLabs Next.js quickstart, Vercel) + "Map" feature idea | **High** |
| `notes/2/20.09.26, 10-08.md` | Raw transcript (German, 6m42s, auto-transcribed, low quality, no speaker labels) of today's discussion on onboarding / knowledge maintenance | **High** |
| `notes/2/20.09.26, 10-08.meeting-report.md` | AI-generated meeting report of the above | **High** |
| `notes/2/meeting-report.user.md` | The prompt used to generate the report + transcript; no extra info | Low |
| `notes/1/29.06.26, 13-33.*` | 47-min meeting from June about **on-prem LLM infrastructure / Model-as-a-Service pitch (Talos, K8s, vLLM, IKB)** — a different project | **Not relevant** to the buildathon; ignore unless told otherwise |
| `*.wav` | Original audio | Not needed |
| `README.md` | GitLab default template | Not relevant |

Transcription caveats: "Launch-Datenbank" likely means "Lern-/Wissens-Datenbank" (knowledge base); "Anstandhaltung der Warnungbank" = "Instandhaltung der Datenbank" (maintenance of the knowledge base).
