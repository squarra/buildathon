# Spatial process feature — design

Date: 2026-09-20 · Branch: `map-feature` · Status: approved

## Goal

A hospitality owner places pins on a floor plan and attaches operational processes to each pin. Staff select a pin, see its processes, and start step-by-step voice guidance. Completing a process records feedback against pin + process. German UI; working name „Hauswissen".

References: `notes/spatial-feature-references/` (project context, interactive mockup, original room map).

## 1. Placement

Built inside the existing Saisonwissen Next.js app as a new nav view **„Karte"** (`view='map'`). Reuses:

- session-cookie workspace storage (`lib/store.ts`: `.data/*.json` locally, Supabase when configured),
- role cookie (`owner` = editor, `staff`/`cleaner` = staff map),
- `transaction()` + `mutate()` reducer and `/api/state`,
- `visible()` role filtering.

No localStorage. Data survives reload and role switches because it is server-side per workspace. README documents: workspace is per browser; shared owner/staff use across devices requires the existing Supabase path.

New code lives in its own modules; `app/page.tsx` only gains the nav entry and `<SpatialView/>` mount.

```
lib/spatial/types.ts      FloorPlan, Room, Pin, GuidanceSession, Feedback
lib/spatial/geometry.ts   toNormalized, clamp01, pointInPolygon, roomAt
lib/spatial/seed.ts       floor plan, 6 rooms, 6 pins, 12 processes
lib/spatial/domain.ts     spatialMutate: pin-save, guidance-start/step, feedback
app/components/spatial/   SpatialView, FloorPlanMap, PinLayer, ProcessPanel,
                          GuidancePanel, FeedbackForm, PinEditor, VoiceSession
app/api/voice/token/route.ts   ElevenLabs WebRTC token (server only)
docs/elevenlabs-agent.md  required agent configuration
```

## 2. Data model

Additions to `lib/types.ts` / `State`:

- `Process` gains `minutes?: number`. `Step` gains `caution?: string`. `Step.body` is the spoken instruction.
- `floorPlans: FloorPlan[]` — `{id, unit, title, width, height, geometry}`. `width/height` = viewBox units (460 × 660). `geometry` = illustrative SVG fragment string (furniture, doors, windows), easy to replace.
- `rooms: Room[]` — `{id, floorPlanId, name, tone: 'bed'|'service'|'living', polygon: [number,number][]}`. Polygon vertices are normalized 0–1 in the floor plan's coordinate system; used for rendering the room fill and for hit-testing.
- `pins: Pin[]` — `{id, floorPlanId, roomId, number, name, x, y, processIds: string[]}`. `x`,`y` normalized 0–1.
- `guidance: GuidanceSession[]` — `{id, pinId, processId, processVersion, role, title, steps: Step[], step, status: 'active'|'done', started, finished?}`. Steps snapshotted at start (same pattern as `Run`). At most one `active` session per role.
- `feedback: Feedback[]` — `{id, sessionId, pinId, processId, role, comment, created}`.

Seed (`lib/spatial/seed.ts`, merged into `seed()`): one floor plan for unit „Alpenblick", six rooms from the mockup (Schlafzimmer 1, Schlafzimmer 2, Küche, Bad, Flur, Wohnzimmer), six pins (01 Doppelbett, 02 Gästebett, 03 Arbeitsfläche, 04 Waschbecken, 05 Toilette, 06 Gästemappe), twelve processes in category „Vor Ort" with German steps, minutes and cautions. „Bett frisch beziehen" is shared by both bed pins to demonstrate reuse.

Backward compatibility: `read()` merges missing spatial arrays from seed into existing workspace files so earlier `.data` workspaces keep working.

## 3. Reducer actions

Dispatched through the existing `mutate(s, role, action)`; spatial types delegate to `spatialMutate`.

| action | who | validation |
|---|---|---|
| `pin-save` `{id?, floorPlanId, name, x, y, processIds}` | owner | name trimmed 1–60 chars; ≥1 processId that exists; x,y within 0–1 and inside a room polygon of that plan (room resolved server-side); on update keep `number`, on create assign next number |
| `guidance-start` `{pinId, processId}` | any | pin exists, process ∈ `pin.processIds` and visible to role; ends any active session of that role; snapshots steps |
| `guidance-step` `{id, op: 'next'|'repeat'|'exit'}` | owner of session | `next` on last step → `status:'done'`, `finished`; `exit` → `status:'done'` with `exited:true`; `repeat` is a no-op server-side (kept for logging symmetry) |
| `feedback` `{sessionId, comment}` | owner of session | session `done`; comment 1–2000 chars; pin/process refs copied from the session |

`visible()`: staff see all floor plans, rooms, pins; processes are already role-filtered; guidance and feedback filtered to own role (owner sees all).

## 4. Map rendering and positioning

`FloorPlanMap`: container `div` with `aspect-ratio: width / height` and `max-width ≈ 400px`; inside, `<svg viewBox="0 0 W H">` renders room polygons (scaled from normalized coords) with tone fills and the `geometry` fragment, plus room labels at polygon centroids. Pins are HTML `<button>`s in an overlay positioned by `left: x*100%; top: y*100%` with `translate(-50%,-100%)`. Container aspect equals viewBox aspect, so percentage placement is exact at any width.

Placing/moving (owner):

- pointer → `toNormalized(clientX, clientY, rect)`; `roomAt(plan rooms, p)`; outside any room → status „Bitte eine Position innerhalb eines Raums wählen." and no move.
- Draft pin: `pointerdown` + `setPointerCapture`, `touch-action: none`; arrow keys move 1 % (Shift 5 %); Enter/Space confirms.
- Tap on the map in placing mode sets the position.

Furniture is illustrative and lives in `geometry`.

## 5. Views (German UI, mockup visual treatment)

Tokens scoped under `.sp` in `globals.css`: accent `#365e49`, pin `#a95736`, soft `#e9eee3`, room fills bed `#e8eddd` / service `#f2ead6` / living `#e6e9e5`, walls `#a8b29f`, Georgia headings.

- **Staff map**: map left, panel right; below 640 px stacked with map first. Selecting a pin highlights it and shows number, room, name, and processes (title, „N Schritte · ca. M Min."). Header tag „6 Wissenspunkte".
- **Guidance**: panel switches; map remains with pin highlighted and context „Aktueller Ort · <pin>". Shows „Schritt n von N", progress track, step title, instruction (serif), caution box, voice status/wave, buttons **Wiederholen**, **Schritt erledigt** (last: **Prozess abschließen**), **Beenden**. Completion → feedback form („Was hat gut geklappt? Was hat gefehlt?", „Feedback an die Inhaberin", „Zur Karte").
- **Owner editor**: owner sees the same map; „Pin anlegen" or tapping a pin opens the editor: name, „Position auf der Karte wählen", live room, checkbox list of processes (title + steps + minutes), „Pin speichern", inline validation. Owner also sees a compact list of received feedback per pin.

## 6. Voice

- Packages: `@elevenlabs/react`, `@elevenlabs/elevenlabs-js`.
- `GET /api/voice/token`: env `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`; `client.conversationalAi.conversations.getWebrtcToken({agentId})` → `{token}`. Missing env → `{demo:true}` (200). Errors → `{error}` with status. No key or agent id in any client payload.
- `VoiceSession` (inside `ConversationProvider`): explicit „Sprachanleitung starten" → `navigator.mediaDevices.getUserMedia({audio:true})` → token → `startSession({conversationToken, connectionType:'webrtc', dynamicVariables:{location, room, process_title, total_steps, step_index, step_title, step_instruction, step_caution, steps_json}, clientTools:{next_step, repeat_step, end_guidance}})`.
- Sync: client tools dispatch `guidance-step` like the buttons; button presses call `sendContextualUpdate(...)` with the new step. Any change of pin or process calls `endSession()` before a new `startSession`. Session id is bound to the guidance session id; tool callbacks ignore events for a stale session.
- Demo mode: banner „Demo-Modus · keine Sprachverbindung" when `{demo:true}` or on connection failure; manual controls unaffected; optional `speechSynthesis` (de-DE) reads the instruction, labeled „Browser-Sprachausgabe (simuliert)".
- `docs/elevenlabs-agent.md`: system prompt template with the variables, first message, language `de`, the three client tools (names, descriptions, parameters; `end_guidance` blocking), security: allow dynamic variables and overrides, env var names.

## 7. Testing

- `tests/spatial.test.ts` (node:test): geometry (`toNormalized`, `pointInPolygon` on seed rooms, out-of-plan rejection); `pin-save` validation (empty name, no process, outside room, non-owner); two pins in Bad expose different processes; guidance start → next → done; feedback stores correct refs; role visibility; client state has no `keyCipher`.
- `tests/api-smoke.mjs` extension: create pin via HTTP, re-read state, pin present; `/api/voice/token` without env → `{demo:true}` and no secret-looking strings.
- Manual browser check at desktop and phone widths: pin → process → guidance → feedback; owner creates pin → switch role → visible.

## 8. Out of scope

Floor-plan drawing tools, indoor positioning, route planning, monthly check-ups, voice-based process capture, process editing inside the pin editor (use „Prozesse").
