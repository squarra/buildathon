

# Elevenlabs interaction
https://github.com/elevenlabs/examples/blob/main/agents/nextjs/quickstart/example/README.md

Yes — that's the better base. It's the official ElevenLabs Next.js quickstart, and it already does the production-correct thing this Swift kit only warns about: the API key stays server-side in app/api/conversation-token, and the browser gets a short-lived token. That means it works with a private agent out of the box, which matters for a public URL.

What it contains:
- @elevenlabs/react (ConversationProvider, useConversationControls, useConversationStatus) — WebRTC session, mic, agent audio playback, speaking state, transcript
- app/api/conversation-token — server route fetching the token with ELEVENLABS_API_KEY
- app/api/agent + a "Create agent" form — dev convenience you don't need for a demo
- Tailwind 4 + shadcn UI, Next 16

Revised plan

1. Scaffold — pull just that example directory into a new sibling folder (../voice-showcase-web), pnpm install, .env with ELEVENLABS_API_KEY.
2. Trim for the demo — remove the create-agent form and api/agent route; read the agent ID from an ELEVENLABS_AGENT_ID env var (server-side, so the ID isn't even in the client bundle). The page becomes: Start → orb/speaking indicator + transcript → Stop.
3. Light restyle — bigger status/speaking indicator so the jury sees who's talking; your hackathon name/title. Nothing more.
4. Deploy to Vercel — npx vercel, set the two env vars in the dashboard, get the HTTPS URL. Test on a phone.

Time: ~1–1.5 h to a deployed URL, leaving you the rest for the agent itself.

Two things to confirm before I touch anything:
- Vercel as the host (natural fit for Next.js; Netlify works too but needs an adapter) — do you have an account?
- New project at ../voice-showcase-web next to this repo, or somewhere else?



# Map 
map featuer / plan of hotel with spatially map processes


