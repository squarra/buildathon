# Voice showcase (Next.js + ElevenLabs Agents)

Public demo page: pick a mode, click **Starten**, talk, hear the agent answer. Live transcript below.

Two agents, one page: **Mitarbeiter-Anleitung** (guides cleaning staff through an
Abreisereinigung) and **Onboarding (Inhaber)** (interviews the owner to capture their
processes). Their prompts and knowledge base live in `../knowledge/` — see its README.

## Setup

```bash
cp .env.example .env   # set ELEVENLABS_API_KEY and the two agent ids
npm install
npm run sync-kb -- --demo   # push prompts + knowledge base to the agents
npm run dev                 # http://localhost:3000
```

The API key stays server-side: `app/api/conversation-token?flow=guidance|onboarding`
mints a short-lived WebRTC token for the agent configured for that flow.

## Scripts

| Command | What it does |
|---|---|
| `npm run sync-kb [-- --demo] [-- --create-missing]` | Upload `../knowledge/` to ElevenLabs and configure both agents |
| `npm run probe [-- guidance\|onboarding]` | Text probes against the live agents via the simulation API |

## Deploy

```bash
npx vercel
npx vercel env add ELEVENLABS_API_KEY production
npx vercel env add ELEVENLABS_AGENT_ID_GUIDANCE production
npx vercel env add ELEVENLABS_AGENT_ID_ONBOARDING production
npx vercel --prod
```
