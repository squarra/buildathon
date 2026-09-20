# Handover — Voice showcase web app (ElevenLabs Agents)

**For:** the implementing agent
**Goal:** a public HTTPS URL where a hackathon jury clicks *Start*, talks, and hears an ElevenLabs agent answer. Live transcript on screen. Nothing else.
**Time box:** ≤ 1.5 h to a deployed URL. Everything after that is polish.
**Decisions already made (do not re-open):**

- Base: the official ElevenLabs Next.js quickstart — `elevenlabs/examples` → `agents/nextjs/quickstart/example`.
- LLM: ElevenLabs' built-in LLM (Claude Sonnet or GPT-4o from the agent's dropdown). **No custom LLM, no model-gateway.**
- Auth: private agent + server-side token route. The API key never reaches the browser.
- Host: Vercel.
- Location: `buildathon26/web/` (this repo).
- Out of scope: text input, user login, multiple agents, the hotel map (see §7 for the hook).

---

## 1. What you are building

```
Browser (Next.js page)              Next.js route handler            ElevenLabs
  click Start
  getUserMedia (mic)
  GET /api/conversation-token  ──►  getWebrtcToken(agentId)   ──►  (xi-api-key)
                               ◄──  { token }                 ◄──  short-lived token
  startSession({ conversationToken })
  ◄═══════════ WebRTC: mic up, agent audio + transcript events down ═══════════►
  onMessage → transcript lines; status/isSpeaking → UI
  click Stop → endSession()
```

The quickstart already does all of this. Your job is to **remove** the dev-only parts (create-agent form, agent-id input, `/api/agent`), **fix** the agent ID via env var, **restyle lightly**, and **deploy**.

## 2. Prerequisites — collect before writing code

| Item | Where | Notes |
|---|---|---|
| `ELEVENLABS_API_KEY` | elevenlabs.io → profile → *API Keys* | **Create a new key** with *Conversational AI* (Agents) permission. The key in `../stozen-landing-page/.env.local` (`ELEVENLABS_KEY`) was made for TTS and may lack that scope — don't assume it works. |
| `ELEVENLABS_AGENT_ID` | elevenlabs.io/app/agents → the agent | Configure per §3 first. |
| Vercel account | vercel.com | `npx vercel login` if not logged in. |
| Node ≥ 20, pnpm or npm | local | `node -v`. |

Never commit `.env`. The quickstart's `.gitignore` covers it; verify after scaffolding.

## 3. ElevenLabs agent configuration (dashboard, ~10 min)

Create the agent at https://elevenlabs.io/app/agents. Settings that matter:

| Setting | Value | Why |
|---|---|---|
| System prompt | The hackathon use case. Include: *"You are a spoken voice assistant. Keep answers to 1–3 sentences. No markdown, no lists, no emojis."* | LLM defaults to text-style output that sounds wrong spoken. |
| First message | A one-line greeting that says what it can do | The jury hears this immediately on Start. |
| LLM | Claude Sonnet or GPT-4o (dropdown) | Built-in; streams; no setup. |
| Voice | Daniel `onwK4e9ZLuTAKqWW03F9` (matches the Stozn demo video) or any | Stability 0.6, style 0 if the option exists. |
| TTS model | Flash v2 / v2.5 | Lowest latency. |
| Security → *Enable authentication* | **On** | Makes the agent private; the token route is the only way in. |
| Security → *Allowlist* | your `*.vercel.app` domain (add after first deploy) | Optional; blocks other origins. |
| Advanced → *Client events* | `audio`, `interruption`, `user_transcript`, `tentative_user_transcript`, `agent_response`, `internal_tentative_agent_response`, `agent_chat_response_part` | Without `audio` you hear nothing; without `user_transcript`/`agent_response` the transcript stays empty. |

Copy the **Agent ID**. Test the agent in the dashboard's *Test* panel once before touching code — if it doesn't talk there, no amount of web code will fix it.

## 4. Scaffold

```bash
cd /Users/matthiassammer/Documents/Projects/buildathon26
npx degit elevenlabs/examples/agents/nextjs/quickstart/example web
cd web
pnpm install          # or: npm install
cp .env.example .env
```

Edit `.env`:

```
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...
```

Run `pnpm dev`, open http://localhost:3000, paste the agent ID into the field, click **Start**, allow the mic, and confirm you hear the agent **before** making any changes. This proves key, agent, and events are right. If it fails here, see §8.

## 5. Trim to the demo

### 5.1 `app/api/conversation-token/route.ts`

Read the agent ID from the environment instead of the query string. Keep the error handling as-is.

```ts
const agentId = process.env.ELEVENLABS_AGENT_ID?.trim();
if (!agentId) {
  return NextResponse.json(
    { error: "Missing ELEVENLABS_AGENT_ID. Add it to your environment." },
    { status: 500 }
  );
}
```

Delete the `searchParams.get("agentId")` block.

### 5.2 Delete `app/api/agent/`

The whole directory. Nothing else imports it.

### 5.3 `app/page.tsx`

Remove:
- `agentIdInput`, `agentLookupError`, `agentLookupOk`, `createError`, `creating` state and their setters
- the `useEffect` that debounces `/api/agent?agentId=` lookups and `lookupTimer`
- `handleCreateAgent`, `handleAgentIdChange`
- the *Agent id* input, *Create agent* button, and their error `<p>`s
- the `VoiceAgentPageProps` fields that carried the above

Change `handleToggleSession`: fetch `/api/conversation-token` with **no query string**; drop the `trimmedId` guard; `canStart` becomes `!starting`.

Keep: `handleMessage`, `handleDebug` (tentative agent text), `TranscriptLine`, the `getUserMedia` permission check, `ConversationProvider` wrapping, `useConversationControls`, `useConversationStatus`.

### 5.4 Speaking indicator

Check what `useConversationStatus()` returns in the installed version:

```bash
grep -n "isSpeaking\|useConversationStatus" node_modules/@elevenlabs/react/dist/index.d.ts
```

If `isSpeaking` is exposed, use it for a big visual state. If not, derive it: `true` between an `agent_response` / `agent_chat_response_part` event and the next `user_transcript` (from `handleMessage`/`handleDebug`). Either way the page shows one of:

- **Idle** — big *Start talking* button
- **Connecting…**
- **Listening** — pulsing ring, neutral colour
- **Speaking** — pulsing ring, accent colour
- **Error** — red banner with the message, button returns to *Start*

### 5.5 Layout (keep it to Tailwind classes already in the project)

Single centered column, max-width ~640px:

1. Title = hackathon project name; one-line subtitle
2. Status ring (~160px circle) with the state label under it
3. Start / Stop button
4. Transcript (existing list; user lines right-aligned or bold, agent lines plain; tentative lines italic grey)

No new dependencies. No shadcn components beyond what's already imported. Dark background reads better on a projector — `bg-neutral-950 text-neutral-100` is enough.

## 6. Deploy to Vercel

```bash
cd web
npx vercel            # link/create project, accept Next.js defaults, deploy preview
npx vercel env add ELEVENLABS_API_KEY production
npx vercel env add ELEVENLABS_AGENT_ID production
npx vercel --prod
```

Then:

1. Open the production URL on a **phone** (not just the laptop) — tap Start, allow mic, confirm audio both ways.
2. Add the Vercel domain to the agent's *Allowlist* in the ElevenLabs dashboard.
3. Put the URL at the top of `buildathon26/README.md`.

## 7. Optional hook — the hotel map (only if §6 is done and time remains)

`notes/stack.md` mentions a hotel floor-plan / spatial-process feature. The way an ElevenLabs agent drives the UI is a **client tool**:

1. Dashboard → agent → *Tools* → *Add client tool*, e.g. `show_location` with parameter `area: string`, *wait for response* on.
2. In `startSession({...})` pass `clientTools: { show_location: async ({ area }) => { setHighlightedArea(area); return "shown"; } }`.
3. Render the highlight on the page.

Do **not** start this before the deployed voice loop works end to end.

## 8. Failure decoder

| Symptom | Likely cause | Check |
|---|---|---|
| `/api/conversation-token` → 401/403 | Key lacks Conversational AI scope, or wrong key | Create a fresh key with Agents permission |
| Token OK, session connects, **no audio** | `audio` client event not enabled on agent | §3 client events |
| Audio OK, **transcript empty** | `user_transcript` / `agent_response` events off | §3 client events |
| Mic prompt never appears | Page not on HTTPS (raw IP / http) | Use `localhost` or the Vercel URL |
| Works on laptop, silent on iPhone | Audio started without a user gesture | Ensure `startSession` runs inside the click handler |
| Agent answers slowly | Non-Flash TTS or a large LLM | Flash v2.5 + Sonnet/GPT-4o |
| Works locally, 500 on Vercel | Env vars not set for *production* | `npx vercel env ls` |
| Session drops after ~minutes | Credits exhausted | Dashboard → usage; Pro tier |

## 9. Definition of done

- [ ] Vercel production URL loads on laptop **and** phone
- [ ] Start → greeting audible within ~2 s
- [ ] Speaking back produces a user transcript line and a spoken agent reply
- [ ] Status ring visibly changes between Listening and Speaking
- [ ] Stop ends the session; Start works again without reload
- [ ] `.env` is not committed; `git status` clean after commit
- [ ] URL written into `README.md`

## 10. Reference

- Quickstart source: https://github.com/elevenlabs/examples/tree/main/agents/nextjs/quickstart/example
- React SDK docs: https://elevenlabs.io/docs/eleven-agents/libraries/react
- Client tools: https://elevenlabs.io/docs/agents-platform/customization/tools/client-tools
- The Swift kit at `../voice-starterkit-swift` is the same architecture on iOS; `AppViewModel.swift` shows the tool-call round-trip if you need a second reference.
