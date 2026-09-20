# Spatial Process Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a „Karte" view to Saisonwissen where the owner places pins on a floor plan and attaches processes, and staff select a pin, start step-by-step (voice) guidance, and leave feedback.

**Architecture:** New spatial entities (floor plan, rooms, pins, guidance sessions, feedback) live in the existing per-workspace `State` and are mutated through the existing `mutate()` reducer via a new `spatialMutate()` in `lib/spatial/domain.ts`. UI is a set of focused client components under `app/components/spatial/`, mounted from `app/page.tsx` as one new view. Voice uses ElevenLabs Agents via a server-only token route; without credentials the UI runs in a labeled demo mode.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, `lucide-react`, `@elevenlabs/react` + `@elevenlabs/elevenlabs-js`, `node:test` via `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-20-spatial-process-feature-design.md`

## Global Constraints

- German UI text throughout; working name „Hauswissen" only in copy where the mockup uses it. Owner is addressed as „Betreiberin" (existing app copy), never „Inhaberin".
- Pin positions and room polygons are normalized 0–1 in the floor plan's coordinate system; floor plan `width`/`height` = 460 × 660 viewBox units.
- `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` are read only in `app/api/voice/token/route.ts`; no `NEXT_PUBLIC_` variants, no key/agent id in any response body.
- Code style: match the repo — dense single-file modules, single quotes, no semicolon-less lines, no Tailwind; classes for the feature are prefixed `sp-`.
- Server validates every action; the client mirrors validation only for instant messages.
- No `localStorage`; persistence is the existing workspace store.
- Commit after every task with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` as the last line.
- Tests: `npm test` runs `node --import tsx tests/domain.test.ts`; add the new test file to that script.

---

## File map

| File | Responsibility |
|---|---|
| `lib/spatial/types.ts` | Spatial entity types + `SpatialState`, `PinDraft` |
| `lib/spatial/geometry.ts` | `clamp01`, `toNormalized`, `pointInPolygon`, `roomAt`, `validPoint` |
| `lib/spatial/seed.ts` | `spatialSeed()` (plan, rooms, pins, processes) + `ensureSpatial()` upgrade |
| `lib/spatial/domain.ts` | `spatialMutate()`, `spatialVisible()` |
| `lib/types.ts` | `Step.caution`, `Process.minutes`, `State & SpatialState`, `ClientState` |
| `lib/seed.ts`, `lib/store.ts`, `lib/domain.ts` | wiring |
| `app/api/voice/token/route.ts` | ElevenLabs WebRTC token / demo flag |
| `app/components/spatial/FloorPlanMap.tsx` | SVG plan + pin layer + placement input |
| `app/components/spatial/ProcessPanel.tsx` | pin details + process list (+ owner feedback list) |
| `app/components/spatial/GuidancePanel.tsx` | step view + manual controls |
| `app/components/spatial/FeedbackForm.tsx` | post-completion feedback |
| `app/components/spatial/PinEditor.tsx` | owner form |
| `app/components/spatial/VoiceSession.tsx` | ElevenLabs session, sync, demo mode |
| `app/components/spatial/SpatialView.tsx` | mode state machine, dispatch, layout |
| `app/page.tsx` | nav entry, view mount, process modal fields |
| `app/globals.css` | `.sp-*` styles |
| `tests/spatial.test.ts`, `tests/spatial-smoke.mjs` | unit + HTTP tests |
| `docs/elevenlabs-agent.md`, `.env.example`, `README.md` | docs |

---

### Task 1: Spatial types, seed data, and storage upgrade

**Files:**
- Create: `lib/spatial/types.ts`
- Create: `lib/spatial/seed.ts`
- Modify: `lib/types.ts`
- Modify: `lib/seed.ts`
- Modify: `lib/store.ts` (inside `transaction`)
- Create: `tests/spatial.test.ts`
- Modify: `package.json` (`test` script)

**Interfaces:**
- Produces: `SpatialState`, `FloorPlan`, `Room`, `Pin`, `GuidanceSession`, `Feedback`, `PinDraft`, `Point`, `Tone` from `lib/spatial/types.ts`; `spatialSeed(): SpatialState & {processes: Process[]}` and `ensureSpatial(s: State): void` from `lib/spatial/seed.ts`; `State` now includes the spatial arrays; `ClientState` exported from `lib/types.ts`; seed floor plan id `fp-alpenblick`, room ids `r-bed1 r-bed2 r-hall r-kitchen r-bath r-living`, pin ids `pin-bed1 pin-bed2 pin-kitchen pin-sink pin-toilet pin-living`, process ids `sp-bett sp-matratze sp-decke sp-arbeitsflaeche sp-kueche sp-kaffee sp-waschbecken sp-seife sp-armatur sp-toilette sp-verbrauch sp-gaestemappe sp-wohnbereich`.

- [ ] **Step 1: Write the failing test**

Create `tests/spatial.test.ts`:

```ts
import test from 'node:test';import assert from 'node:assert/strict';
import {seed} from '../lib/seed';
import {ensureSpatial} from '../lib/spatial/seed';

test('Seed enthält Grundriss, sechs Räume, sechs Pins und verortete Prozesse',()=>{const s=seed();assert.equal(s.floorPlans.length,1);assert.equal(s.rooms.length,6);assert.equal(s.pins.length,6);assert.ok(s.processes.filter(p=>p.category==='Vor Ort').length>=12);
for(const p of s.pins){assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1,`Pin ${p.id} normalisiert`);assert.ok(s.rooms.some(r=>r.id===p.roomId),`Pin ${p.id} hat Raum`);assert.ok(p.processIds.length>=1);for(const id of p.processIds)assert.ok(s.processes.some(x=>x.id===id),`Prozess ${id} existiert`);}
for(const r of s.rooms)for(const [x,y] of r.polygon)assert.ok(x>=0&&x<=1&&y>=0&&y<=1);
assert.deepEqual(s.guidance,[]);assert.deepEqual(s.feedback,[]);
const shared=s.pins.filter(p=>p.processIds.includes('sp-bett'));assert.equal(shared.length,2,'Bett-Prozess wird an zwei Pins wiederverwendet');
assert.ok(s.processes.find(p=>p.id==='sp-waschbecken')!.steps.some(st=>st.caution));assert.equal(typeof s.processes.find(p=>p.id==='sp-waschbecken')!.minutes,'number');});

test('ensureSpatial ergänzt fehlende Spatial-Daten in alten Arbeitsbereichen',()=>{const s:any=seed();delete s.floorPlans;delete s.rooms;delete s.pins;delete s.guidance;delete s.feedback;s.processes=s.processes.filter((p:any)=>p.category!=='Vor Ort');ensureSpatial(s);assert.equal(s.floorPlans.length,1);assert.equal(s.pins.length,6);assert.ok(s.processes.some((p:any)=>p.id==='sp-bett'));ensureSpatial(s);assert.equal(s.processes.filter((p:any)=>p.id==='sp-bett').length,1,'idempotent');});
```

Update `package.json` test script:

```json
"test": "node --import tsx tests/domain.test.ts && node --import tsx tests/spatial.test.ts"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm install && node --import tsx tests/spatial.test.ts`
Expected: FAIL — `Cannot find module '../lib/spatial/seed'`.

- [ ] **Step 3: Create `lib/spatial/types.ts`**

```ts
import type {Role,Step} from '../types';
export type Tone='bed'|'service'|'living';
export type Point={x:number;y:number};
export type FloorPlan={id:string;unit:string;title:string;width:number;height:number;geometry:string};
export type Room={id:string;floorPlanId:string;name:string;tone:Tone;polygon:[number,number][];label:Point};
export type Pin={id:string;floorPlanId:string;roomId:string;number:number;name:string;x:number;y:number;processIds:string[]};
export type GuidanceSession={id:string;pinId:string;processId:string;processVersion:number;role:Role;title:string;minutes?:number;steps:Step[];step:number;status:'active'|'done';exited?:boolean;started:string;finished?:string};
export type Feedback={id:string;sessionId:string;pinId:string;processId:string;role:Role;comment:string;created:string};
export type SpatialState={floorPlans:FloorPlan[];rooms:Room[];pins:Pin[];guidance:GuidanceSession[];feedback:Feedback[]};
export type PinDraft={id?:string;name:string;x:number;y:number;processIds:string[]};
```

- [ ] **Step 4: Extend `lib/types.ts`**

Apply these exact edits:

1. Add as first line: `import type {SpatialState} from './spatial/types';`
2. Replace `export type Step={id:string;title:string;body:string;titleEn?:string;bodyEn?:string;entryIds:string[]};` with `export type Step={id:string;title:string;body:string;caution?:string;titleEn?:string;bodyEn?:string;entryIds:string[]};`
3. In `Process`, replace `steps:Step[];version:number;` with `steps:Step[];minutes?:number;version:number;`
4. At the end of the `State` line replace `settings:{keyCipher?:string;calls:number;day:string}};` with `settings:{keyCipher?:string;calls:number;day:string}}&SpatialState;`
5. Append: `export type ClientState=Omit<State,'settings'|'handover'>&{settings:{hasKey:boolean;calls:number};handover:State['handover']|null};`

- [ ] **Step 5: Create `lib/spatial/seed.ts`**

Polygons and pin positions are the mockup's viewBox coordinates (460 × 660) normalized at module load. Furniture/doors/windows are illustrative SVG in `geometry` (classes `sp-*`, styled in Task 5).

```ts
import type {Process,State} from '../types';
import type {FloorPlan,Room,Pin,SpatialState} from './types';
const W=460,H=660;
const poly=(pts:number[][])=>pts.map(([x,y])=>[+(x/W).toFixed(4),+(y/H).toFixed(4)] as [number,number]);
const pt=(x:number,y:number)=>({x:+(x/W).toFixed(4),y:+(y/H).toFixed(4)});
const geometry=`<path class="sp-connector" d="M146 214V233H182V214ZM293 214V233H328V214Z"/>
<g class="sp-furniture"><rect x="55" y="62" width="113" height="113" rx="4"/><rect x="62" y="69" width="45" height="29" rx="5"/><rect x="115" y="69" width="45" height="29" rx="5"/><rect x="289" y="66" width="90" height="109" rx="4"/><rect x="296" y="73" width="33" height="27" rx="5"/><rect x="337" y="73" width="33" height="27" rx="5"/><rect x="61" y="281" width="25" height="124" rx="2"/><rect x="61" y="392" width="45" height="17" rx="2"/><rect x="211" y="321" width="91" height="25" rx="3"/><ellipse cx="255" cy="334" rx="22" ry="7"/><rect x="143" y="321" width="27" height="12" rx="3"/><ellipse cx="156.5" cy="347" rx="12" ry="16"/><rect x="280" y="356" width="30" height="28" rx="3"/><rect x="343" y="312" width="46" height="15" rx="2"/><rect x="59" y="495" width="30" height="95" rx="5"/><rect x="59" y="589" width="112" height="27" rx="5"/><rect x="94" y="510" width="94" height="73" rx="10"/><ellipse cx="274" cy="531" rx="37" ry="30"/><rect x="258" y="488" width="30" height="10" rx="4"/><rect x="258" y="564" width="30" height="10" rx="4"/><rect x="222" y="515" width="11" height="27" rx="4"/><rect x="314" y="515" width="11" height="27" rx="4"/></g>
<g class="sp-furniture-line"><path d="M55 107H168M289 110H379M69 309H80M69 356H80M273 324V330M258 331V336M169 322V332M63 534H84M63 566H84M100 593V613M132 593V613"/><rect x="68" y="287" width="11" height="15" rx="2"/><path d="M284 360L306 380M306 360L284 380"/></g>
<g class="sp-door-gap"><path d="M146 214H182M293 214H328M146 233H182M293 233H328M119 247V278M176 314H208M65 452H105M438 372V399"/></g>
<g class="sp-door"><path d="M146 214V181A33 33 0 0 1 179 214M293 214V181A33 33 0 0 1 326 214M119 247H150A31 31 0 0 1 119 278M176 314V347A33 33 0 0 0 209 314M65 452V485A33 33 0 0 0 98 452"/></g>
<g class="sp-window-line"><path d="M49 23H120M305 23H378M33 89V151M105 628H150M273 641H319"/></g>`;
const plan:FloorPlan={id:'fp-alpenblick',unit:'Alpenblick',title:'Alpenblick · Grundriss',width:W,height:H,geometry};
const rooms:Room[]=[
{id:'r-bed1',floorPlanId:plan.id,name:'Schlafzimmer 1',tone:'bed',polygon:poly([[32,22],[144,22],[144,30],[204,30],[204,193],[190,193],[190,214],[32,214]]),label:{x:.255,y:.07}},
{id:'r-bed2',floorPlanId:plan.id,name:'Schlafzimmer 2',tone:'bed',polygon:poly([[258,22],[399,22],[399,65],[423,65],[423,200],[405,200],[405,214],[278,214],[278,128],[258,128]]),label:{x:.73,y:.07}},
{id:'r-hall',floorPlanId:plan.id,name:'Flur',tone:'living',polygon:poly([[119,233],[363,233],[363,302],[421,302],[421,360],[438,360],[438,406],[342,406],[342,351],[321,351],[321,307],[119,307]]),label:{x:.85,y:.56}},
{id:'r-kitchen',floorPlanId:plan.id,name:'Küche',tone:'service',polygon:poly([[53,233],[119,233],[119,429],[164,429],[164,452],[53,452]]),label:{x:.187,y:.395}},
{id:'r-bath',floorPlanId:plan.id,name:'Bad',tone:'service',polygon:poly([[134,314],[320,314],[320,393],[159,393],[159,382],[134,382]]),label:{x:.49,y:.57}},
{id:'r-living',floorPlanId:plan.id,name:'Wohnzimmer',tone:'living',polygon:poly([[53,452],[202,452],[202,469],[258,469],[258,452],[354,452],[354,626],[335,626],[335,641],[160,641],[160,627],[32,627],[32,501],[53,501]]),label:{x:.48,y:.91}}];
type Def=[string,string,string,number,[string,string,string?][]];
const defs:Def[]=[
['sp-bett','Bett frisch beziehen','Bett für die nächsten Gäste vorbereiten.',6,[['Bett abziehen','Bettwäsche und Bezüge vollständig abziehen und in den grauen Wäschesack geben.','Benutzte Wäsche nicht auf den Boden legen.'],['Matratze kontrollieren','Matratze und Topper auf Flecken, Feuchtigkeit und Schäden prüfen. Auffälligkeiten fotografieren und melden.'],['Frisch beziehen','Spannbettlaken glatt ziehen, Decken und Kissen mit frischer Wäsche beziehen. Verschlüsse nach unten.'],['Für die Anreise vorbereiten','Decke zurückschlagen, Kissen aufschütteln, Bett glatt streichen und den Nachttisch abwischen.']]],
['sp-matratze','Matratze kontrollieren','Kurzer Check zwischen zwei Belegungen.',2,[['Oberfläche prüfen','Matratzenschoner abnehmen und die Oberfläche auf Flecken und Feuchtigkeit prüfen.'],['Auffälligkeiten melden','Schäden oder Flecken mit Foto über „Problem melden“ an die Betreiberin geben.']]],
['sp-decke','Zusatzdecke bereitlegen','Für kühle Nächte oder Gästewunsch.',1,[['Decke prüfen','Zusatzdecke aus dem Schrank nehmen und auf Sauberkeit und Geruch prüfen.'],['Decke bereitlegen','Decke gefaltet am Fußende des Bettes ablegen.']]],
['sp-arbeitsflaeche','Arbeitsfläche reinigen','Küchenzeile hygienisch sauber machen.',4,[['Fläche freiräumen','Alle Gegenstände von der Arbeitsfläche nehmen und Geschirr in die Spüle stellen.'],['Krümel entfernen','Krümel und lose Reste mit dem Handbesen in den Restmüll fegen.'],['Fläche reinigen','Mit dem Küchenreiniger und dem blauen Küchentuch die Fläche abwischen.','Nur das blaue Küchentuch verwenden, nie ein Badtuch.'],['Trocken nachwischen','Mit einem trockenen Tuch nachwischen, damit keine Streifen bleiben.']]],
['sp-kueche','Küchenausstattung prüfen','Vollständigkeit vor der Anreise.',3,[['Geschirr prüfen','Teller, Gläser und Besteck laut Inventarliste zählen und auf Schäden prüfen.'],['Geräte prüfen','Kaffeemaschine, Wasserkocher und Herd kurz einschalten und Funktion prüfen.','Keine Geräte öffnen; Defekte nur melden.'],['Fehlendes melden','Fehlende oder defekte Teile über „Problem melden“ an die Betreiberin geben.']]],
['sp-kaffee','Kaffee & Tee auffüllen','Willkommensvorrat ergänzen.',2,[['Bestand prüfen','Kapseln, Teebeutel und Zucker im Vorratskorb zählen.'],['Vorräte auffüllen','Aus dem Wirtschaftsraum auf je sechs Kapseln und sechs Teebeutel auffüllen.'],['Ordentlich anrichten','Korb sauber wischen und sichtbar neben der Kaffeemaschine platzieren.']]],
['sp-waschbecken','Waschbecken reinigen','Becken und Armatur streifenfrei.',3,[['Tuch vorbereiten','Lege ein frisches Tuch bereit, das nur für das Waschbecken verwendet wird.','Eigene Tücher für Waschbecken und Toilette verwenden.'],['Becken reinigen','Reinige das Becken mit dem Badreiniger und spüle anschließend mit klarem Wasser nach.'],['Armatur polieren','Wische die Armatur ab und poliere sie mit einem trockenen, sauberen Tuch.'],['Ergebnis prüfen','Prüfe Becken und Armatur auf Rückstände. Lege das verwendete Tuch zur Wäsche.']]],
['sp-seife','Seife nachfüllen','Spender am Waschbecken.',1,[['Füllstand prüfen','Seifenspender anheben und Füllstand prüfen.'],['Seife nachfüllen','Bei weniger als der Hälfte aus dem Kanister im Wirtschaftsraum nachfüllen.'],['Spender abwischen','Spender außen abwischen und zurückstellen.']]],
['sp-armatur','Armatur prüfen','Wasser und Abfluss kontrollieren.',2,[['Wasser öffnen','Warm- und Kaltwasser kurz laufen lassen und auf Druck und Temperatur achten.'],['Abfluss prüfen','Abfluss beobachten: läuft das Wasser zügig ab? Sieb bei Bedarf reinigen.'],['Auffälligkeiten melden','Tropfen, Kalk oder langsamen Abfluss an die Betreiberin melden.']]],
['sp-toilette','Toilette reinigen','Hygienisch und sicher.',5,[['Eigenes Tuch bereitlegen','Handschuhe anziehen und das rote Toilettentuch bereitlegen.','Das rote Tuch nie für Waschbecken oder Dusche verwenden.'],['Reiniger anwenden','WC-Reiniger unter den Rand geben und einige Minuten einwirken lassen.','Reinigungsmittel nicht mischen.'],['Außenflächen reinigen','Deckel, Brille und Außenseite mit dem roten Tuch abwischen; innen mit der Bürste reinigen und spülen.'],['Ergebnis prüfen','Sichtkontrolle, Deckel schließen, Handschuhe ausziehen und Hände waschen.']]],
['sp-verbrauch','Verbrauchsmaterial auffüllen','Papier und Hygieneartikel.',1,[['Bestand prüfen','Toilettenpapier und Hygienebeutel im Bad zählen.'],['Papier auffüllen','Auf zwei volle Rollen plus Reserve auffüllen; Reserve sichtbar im Regal.']]],
['sp-gaestemappe','Gästemappe vorbereiten','Alle Informationen vollständig.',2,[['Vollständigkeit prüfen','Gästemappe öffnen und prüfen, ob WLAN-Blatt, Hausordnung und Notfallnummern enthalten sind.'],['Informationen prüfen','Kontrollieren, ob die Angaben aktuell sind; veraltete Blätter melden.','Keine persönlichen Gästedaten in die Mappe legen.'],['Mappe bereitlegen','Mappe geschlossen mittig auf den Wohnzimmertisch legen.']]],
['sp-wohnbereich','Wohnbereich vorbereiten','Der erste Eindruck bei der Anreise.',4,[['Lüften','Fenster fünf Minuten weit öffnen.'],['Oberflächen prüfen','Tisch, Regale und Fensterbänke abwischen.'],['Sitzbereich herrichten','Kissen aufschütteln, Decke falten, Fernbedienungen auf den Tisch legen.'],['Raum kontrollieren','Fenster schließen, Licht aus, letzter Blick auf den Gesamteindruck.']]]];
const pins:Pin[]=[
{id:'pin-bed1',floorPlanId:plan.id,roomId:'r-bed1',number:1,name:'Doppelbett',...pt(117,139),processIds:['sp-bett','sp-matratze']},
{id:'pin-bed2',floorPlanId:plan.id,roomId:'r-bed2',number:2,name:'Gästebett',...pt(335,140),processIds:['sp-bett','sp-decke']},
{id:'pin-kitchen',floorPlanId:plan.id,roomId:'r-kitchen',number:3,name:'Arbeitsfläche',...pt(85,353),processIds:['sp-arbeitsflaeche','sp-kueche','sp-kaffee']},
{id:'pin-sink',floorPlanId:plan.id,roomId:'r-bath',number:4,name:'Waschbecken',...pt(258,337),processIds:['sp-waschbecken','sp-seife','sp-armatur']},
{id:'pin-toilet',floorPlanId:plan.id,roomId:'r-bath',number:5,name:'Toilette',...pt(157,354),processIds:['sp-toilette','sp-verbrauch']},
{id:'pin-living',floorPlanId:plan.id,roomId:'r-living',number:6,name:'Gästemappe',...pt(278,538),processIds:['sp-gaestemappe','sp-wohnbereich']}];
export function spatialProcesses():Process[]{return defs.map(([id,title,description,minutes,steps])=>({id,title,description,category:'Vor Ort',roles:['owner','staff','cleaner'],minutes,version:1,steps:steps.map(([t,body,caution],i)=>({id:`${id}-s${i}`,title:t,body,caution,entryIds:[]}))}));}
export function spatialSeed():SpatialState&{processes:Process[]}{return {floorPlans:[structuredClone(plan)],rooms:structuredClone(rooms),pins:structuredClone(pins),guidance:[],feedback:[],processes:spatialProcesses()};}
export function ensureSpatial(s:State){const d=spatialSeed();for(const k of ['floorPlans','rooms','pins','guidance','feedback'] as const)if(!Array.isArray(s[k]))(s as any)[k]=d[k];for(const p of d.processes)if(!s.processes.some(x=>x.id===p.id))s.processes.push(p);}
```

- [ ] **Step 6: Wire seed and store**

In `lib/seed.ts`:
1. Add import after the existing import line: `import {spatialSeed} from './spatial/seed';`
2. Replace the beginning of the final `return {entries,processes,` with `const sp=spatialSeed();return {floorPlans:sp.floorPlans,rooms:sp.rooms,pins:sp.pins,guidance:sp.guidance,feedback:sp.feedback,entries,processes:[...processes,...sp.processes],`

In `lib/store.ts`:
1. Add import: `import {ensureSpatial} from './spatial/seed';`
2. In `transaction`, replace `const record=await read(id);const value=await fn(record.data);` with `const record=await read(id);ensureSpatial(record.data);const value=await fn(record.data);`

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: all existing `domain.test.ts` tests still PASS (the api-smoke expectation of 16 entries is unchanged; processes grew from 4 to 17) and both new tests PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/spatial/types.ts lib/spatial/seed.ts lib/types.ts lib/seed.ts lib/store.ts tests/spatial.test.ts package.json
git commit -m "Add spatial entities and seed data for the Karte view

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Geometry helpers

**Files:**
- Create: `lib/spatial/geometry.ts`
- Modify: `tests/spatial.test.ts`

**Interfaces:**
- Produces: `clamp01(n:number):number`, `toNormalized(clientX:number,clientY:number,rect:{left:number;top:number;width:number;height:number}):Point`, `pointInPolygon(p:Point,polygon:[number,number][]):boolean`, `roomAt(rooms:Room[],floorPlanId:string,p:Point):Room|undefined`, `validPoint(p:unknown):p is Point`. No Node-only imports (used in the browser).

- [ ] **Step 1: Write the failing tests** (append to `tests/spatial.test.ts`)

```ts
import {clamp01,toNormalized,pointInPolygon,roomAt,validPoint} from '../lib/spatial/geometry';

test('Geometrie: Pointer → normalisierte Koordinaten, Raumtreffer, Ablehnung außerhalb',()=>{const s=seed();const rect={left:100,top:50,width:400,height:600};
assert.deepEqual(toNormalized(100,50,rect),{x:0,y:0});assert.deepEqual(toNormalized(500,650,rect),{x:1,y:1});assert.deepEqual(toNormalized(300,350,rect),{x:.5,y:.5});assert.deepEqual(toNormalized(0,0,rect),{x:0,y:0},'wird begrenzt');
assert.equal(clamp01(1.4),1);assert.equal(clamp01(-2),0);
const bath=s.rooms.find(r=>r.id==='r-bath')!;assert.ok(pointInPolygon({x:258/460,y:337/660},bath.polygon));assert.ok(!pointInPolygon({x:140/460,y:388/660},bath.polygon),'Kerbe links unten gehört nicht zum Bad');
for(const p of s.pins)assert.equal(roomAt(s.rooms,'fp-alpenblick',p)?.id,p.roomId,`Pin ${p.id} liegt im gespeicherten Raum`);
assert.equal(roomAt(s.rooms,'fp-alpenblick',{x:.02,y:.02}),undefined,'Ecke außerhalb');assert.equal(roomAt(s.rooms,'fp-alpenblick',{x:.5,y:.98}),undefined,'unter dem Wohnzimmer');assert.equal(roomAt(s.rooms,'anderer-plan',{x:.5,y:.5}),undefined);
assert.ok(validPoint({x:0,y:1}));assert.ok(!validPoint({x:1.1,y:0}));assert.ok(!validPoint({x:'0.5',y:0.5}));assert.ok(!validPoint(null));});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --import tsx tests/spatial.test.ts`
Expected: FAIL — cannot find `../lib/spatial/geometry`.

- [ ] **Step 3: Create `lib/spatial/geometry.ts`**

```ts
import type {Point,Room} from './types';
export const clamp01=(n:number)=>Math.min(1,Math.max(0,n));
export function toNormalized(clientX:number,clientY:number,rect:{left:number;top:number;width:number;height:number}):Point{return {x:clamp01((clientX-rect.left)/rect.width),y:clamp01((clientY-rect.top)/rect.height)};}
export function pointInPolygon(p:Point,polygon:[number,number][]){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if((yi>p.y)!==(yj>p.y)&&p.x<(xj-xi)*(p.y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
export function roomAt(rooms:Room[],floorPlanId:string,p:Point){return rooms.find(r=>r.floorPlanId===floorPlanId&&pointInPolygon(p,r.polygon));}
export const validPoint=(p:any):p is Point=>!!p&&typeof p.x==='number'&&typeof p.y==='number'&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
```

- [ ] **Step 4: Run tests**

Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/spatial/geometry.ts tests/spatial.test.ts
git commit -m "Add floor plan geometry helpers

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Spatial reducer, visibility, and process caution/minutes

**Files:**
- Create: `lib/spatial/domain.ts`
- Modify: `lib/domain.ts`
- Modify: `tests/spatial.test.ts`

**Interfaces:**
- Consumes: `roomAt`, `validPoint` (Task 2); types (Task 1).
- Produces: `spatialMutate(s:State,role:Role,a:Record<string,any>):boolean` (returns `false` when `a.type` is not spatial) and `spatialVisible(s:State,role:Role)` from `lib/spatial/domain.ts`. Action shapes:
  - `{type:'pin-save',id?:string,floorPlanId:string,name:string,x:number,y:number,processIds:string[]}` (owner)
  - `{type:'guidance-start',pinId:string,processId:string}`
  - `{type:'guidance-step',id:string,op:'next'|'repeat'|'exit'}`
  - `{type:'guidance-feedback',sessionId:string,comment:string}`
  - existing `{type:'process',...}` now accepts `minutes` and per-step `caution`.

- [ ] **Step 1: Write the failing tests** (append to `tests/spatial.test.ts`)

```ts
import {mutate,visible} from '../lib/domain';

test('Pin speichern: nur Betreiberin, Name und Prozess Pflicht, Position muss in einem Raum liegen',()=>{const s=seed();const base={type:'pin-save',floorPlanId:'fp-alpenblick',name:'Materialschrank',x:.8,y:.5,processIds:['sp-verbrauch']};
assert.throws(()=>mutate(s,'cleaner',base),/Betreiberin/);assert.throws(()=>mutate(s,'owner',{...base,name:'  '}),/Namen/);assert.throws(()=>mutate(s,'owner',{...base,processIds:[]}),/mindestens einen Prozess/);assert.throws(()=>mutate(s,'owner',{...base,processIds:['gibt-es-nicht']}),/mindestens einen Prozess/);assert.throws(()=>mutate(s,'owner',{...base,x:.02,y:.02}),/innerhalb eines Raums/);assert.throws(()=>mutate(s,'owner',{...base,x:1.5}),/Position/);assert.throws(()=>mutate(s,'owner',{...base,floorPlanId:'nope'}),/Grundriss/);
mutate(s,'owner',base);const pin=s.pins[s.pins.length-1];assert.equal(pin.number,7);assert.equal(pin.roomId,'r-hall');assert.equal(pin.name,'Materialschrank');
mutate(s,'owner',{...base,id:pin.id,name:'Putzschrank',x:.15,y:.45,processIds:['sp-verbrauch','sp-kaffee','sp-kaffee']});assert.equal(s.pins.length,7);assert.equal(pin.name,'Putzschrank');assert.equal(pin.roomId,'r-kitchen');assert.deepEqual(pin.processIds,['sp-verbrauch','sp-kaffee']);assert.equal(pin.number,7,'Nummer bleibt bei Bearbeitung');
assert.throws(()=>mutate(s,'owner',{...base,id:'fehlt'}),/Pin fehlt/);});

test('Zwei Pins im selben Raum zeigen unterschiedliche Prozesse; Sichtbarkeit nach Rolle',()=>{const s=seed();const sink=s.pins.find(p=>p.id==='pin-sink')!,toilet=s.pins.find(p=>p.id==='pin-toilet')!;assert.equal(sink.roomId,toilet.roomId);assert.notDeepEqual(sink.processIds,toilet.processIds);
mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-sink',processId:'sp-waschbecken'});mutate(s,'staff',{type:'guidance-start',pinId:'pin-toilet',processId:'sp-toilette'});
const c=visible(s,'cleaner') as any,o=visible(s,'owner') as any;assert.equal(c.pins.length,6);assert.equal(c.guidance.length,1);assert.equal(c.guidance[0].pinId,'pin-sink');assert.equal(o.guidance.length,2);assert.equal('keyCipher' in c.settings,false);});

test('Anleitung: startet mit Ort und Prozess, schreitet fort, endet, Feedback referenziert Ort und Prozess',()=>{const s=seed();
assert.throws(()=>mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-sink',processId:'sp-toilette'}),/nicht verfügbar/);
mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-sink',processId:'sp-waschbecken'});const g=s.guidance[0];assert.equal(g.pinId,'pin-sink');assert.equal(g.processId,'sp-waschbecken');assert.equal(g.steps.length,4);assert.equal(g.step,0);assert.equal(g.status,'active');assert.equal(g.processVersion,1);
assert.throws(()=>mutate(s,'cleaner',{type:'guidance-feedback',sessionId:g.id,comment:'zu früh'}),/Abschluss/);
mutate(s,'cleaner',{type:'guidance-step',id:g.id,op:'repeat'});assert.equal(g.step,0);
mutate(s,'cleaner',{type:'guidance-step',id:g.id,op:'next'});assert.equal(g.step,1);
assert.throws(()=>mutate(s,'staff',{type:'guidance-step',id:g.id,op:'next'}),/Keine aktive/);
mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-toilet',processId:'sp-toilette'});assert.equal(g.status,'done');assert.equal(g.exited,true,'Wechsel beendet die alte Sitzung ausdrücklich');const g2=s.guidance[0];assert.equal(g2.pinId,'pin-toilet');
for(let i=0;i<4;i++)mutate(s,'cleaner',{type:'guidance-step',id:g2.id,op:'next'});assert.equal(g2.status,'done');assert.ok(g2.finished);assert.equal(g2.exited,undefined);
assert.throws(()=>mutate(s,'cleaner',{type:'guidance-feedback',sessionId:g2.id,comment:''}),/Feedback/);
mutate(s,'cleaner',{type:'guidance-feedback',sessionId:g2.id,comment:'Der Hinweis zum roten Tuch war hilfreich.'});const f=s.feedback[0];assert.equal(f.pinId,'pin-toilet');assert.equal(f.processId,'sp-toilette');assert.equal(f.sessionId,g2.id);assert.equal(f.role,'cleaner');
assert.throws(()=>mutate(s,'cleaner',{type:'guidance-feedback',sessionId:g2.id,comment:'nochmal'}),/bereits/);
mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-sink',processId:'sp-seife'});const g3=s.guidance[0];mutate(s,'cleaner',{type:'guidance-step',id:g3.id,op:'exit'});assert.equal(g3.status,'done');assert.equal(g3.exited,true);});

test('Prozess bearbeiten bewahrt Hinweis und Dauer',()=>{const s=seed();const p=s.processes.find(p=>p.id==='sp-waschbecken')!;mutate(s,'owner',{type:'process',id:p.id,title:p.title,description:p.description,minutes:'4',steps:p.steps.map(st=>({...st}))});assert.equal(p.minutes,4);assert.equal(p.version,2);assert.ok(p.steps[0].caution);assert.throws(()=>mutate(s,'owner',{type:'process',id:p.id,title:p.title,minutes:'abc',steps:p.steps}),/Dauer/);});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --import tsx tests/spatial.test.ts`
Expected: FAIL with `Unbekannte Aktion.` on `pin-save`.

- [ ] **Step 3: Create `lib/spatial/domain.ts`**

```ts
import {randomUUID} from 'node:crypto';
import type {State,Role} from '../types';
import {roomAt,validPoint} from './geometry';
const now=()=>new Date().toISOString();
function str(v:unknown,max:number){if(typeof v!=='string'||v.length>max)throw Error('Ungültige Eingabe.');return v.trim();}
export function spatialMutate(s:State,role:Role,a:Record<string,any>):boolean{
if(a.type==='pin-save'){
if(role!=='owner')throw Error('Nur die Betreiberin kann Pins bearbeiten.');
const plan=s.floorPlans.find(f=>f.id===a.floorPlanId);if(!plan)throw Error('Grundriss fehlt.');
const name=str(a.name,60);if(!name)throw Error('Bitte gib dem Ort einen Namen.');
const processIds=[...new Set((Array.isArray(a.processIds)?a.processIds:[]).filter((id:unknown)=>typeof id==='string'&&s.processes.some(p=>p.id===id)))] as string[];if(!processIds.length)throw Error('Wähle mindestens einen Prozess.');
const p={x:a.x,y:a.y};if(!validPoint(p))throw Error('Ungültige Position.');
const room=roomAt(s.rooms,plan.id,p);if(!room)throw Error('Bitte eine Position innerhalb eines Raums wählen.');
const existing=a.id?s.pins.find(x=>x.id===a.id):undefined;if(a.id&&!existing)throw Error('Pin fehlt.');
if(existing)Object.assign(existing,{name,x:p.x,y:p.y,roomId:room.id,processIds});
else s.pins.push({id:randomUUID(),floorPlanId:plan.id,roomId:room.id,number:Math.max(0,...s.pins.map(x=>x.number))+1,name,x:p.x,y:p.y,processIds});
return true;}
if(a.type==='guidance-start'){
const pin=s.pins.find(x=>x.id===a.pinId);if(!pin)throw Error('Ort fehlt.');
const proc=s.processes.find(x=>x.id===a.processId&&pin.processIds.includes(x.id)&&x.roles.includes(role));if(!proc)throw Error('Prozess an diesem Ort nicht verfügbar.');
for(const g of s.guidance)if(g.role===role&&g.status==='active'){g.status='done';g.exited=true;g.finished=now();}
s.guidance.unshift({id:randomUUID(),pinId:pin.id,processId:proc.id,processVersion:proc.version,role,title:proc.title,minutes:proc.minutes,steps:structuredClone(proc.steps),step:0,status:'active',started:now()});
if(s.guidance.length>50)s.guidance.length=50;
return true;}
if(a.type==='guidance-step'){
const g=s.guidance.find(x=>x.id===a.id&&x.role===role);if(!g||g.status!=='active')throw Error('Keine aktive Anleitung.');
if(a.op==='next'){if(g.step>=g.steps.length-1){g.status='done';g.finished=now();}else g.step++;}
else if(a.op==='exit'){g.status='done';g.exited=true;g.finished=now();}
else if(a.op!=='repeat')throw Error('Unbekannter Schritt.');
return true;}
if(a.type==='guidance-feedback'){
const g=s.guidance.find(x=>x.id===a.sessionId&&x.role===role);if(!g||g.status!=='done')throw Error('Feedback ist erst nach Abschluss möglich.');
const comment=str(a.comment,2000);if(!comment)throw Error('Bitte kurz dein Feedback ergänzen.');
if(s.feedback.some(f=>f.sessionId===g.id))throw Error('Feedback wurde bereits gesendet.');
s.feedback.unshift({id:randomUUID(),sessionId:g.id,pinId:g.pinId,processId:g.processId,role,comment,created:now()});
return true;}
return false;}
export function spatialVisible(s:State,role:Role){return {floorPlans:s.floorPlans,rooms:s.rooms,pins:s.pins,guidance:s.guidance.filter(g=>role==='owner'||g.role===role),feedback:s.feedback.filter(f=>role==='owner'||f.role===role)};}
```

- [ ] **Step 4: Wire into `lib/domain.ts`** (exact edits)

1. Add import after the existing imports: `import {spatialMutate,spatialVisible} from './spatial/domain';`
2. In `visible`, replace `checks:role==='owner'?s.checks:[],` with `checks:role==='owner'?s.checks:[],...spatialVisible(s,role),`
3. In `mutate`, directly after the line `const owner=()=>{if(role!=='owner')throw Error('Nur die Betreiberin kann diese Aktion ausführen.');};` insert: `if(spatialMutate(s,role,a))return s;`
4. In the `a.type==='process'` branch, replace `body:str(st.body,5000),entryIds:[]})):[];` with `body:str(st.body,5000),caution:typeof st.caution==='string'&&st.caution.trim()?str(st.caution,300):undefined,entryIds:[]})):[];`
5. Same branch, replace `if(steps.length>30)throw Error('Maximal 30 Schritte.');` with `if(steps.length>30)throw Error('Maximal 30 Schritte.');const minutes=a.minutes===undefined||a.minutes===null||a.minutes===''?undefined:Number(a.minutes);if(minutes!==undefined&&(!Number.isFinite(minutes)||minutes<0||minutes>600))throw Error('Bitte eine Dauer in Minuten angeben.');`
6. Same branch, replace `p.steps=steps;p.version++;}` with `p.steps=steps;p.minutes=minutes;p.version++;}` and replace `roles:['owner','staff','cleaner'],steps,version:1});}` with `roles:['owner','staff','cleaner'],steps,minutes,version:1});}`

- [ ] **Step 5: Run tests**

Run: `npm test` — Expected: PASS (existing + 5 new spatial tests).

- [ ] **Step 6: Commit**

```bash
git add lib/spatial/domain.ts lib/domain.ts tests/spatial.test.ts
git commit -m "Add spatial reducer: pins, guidance sessions, feedback

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Voice token route, dependencies, env example

**Files:**
- Create: `app/api/voice/token/route.ts`
- Create: `.env.example`
- Modify: `package.json` (dependencies via `npm install`)
- Create: `tests/spatial-smoke.mjs` (first part; extended in Task 9)

**Interfaces:**
- Produces: `GET /api/voice/token` → `200 {demo:true}` when env missing, `200 {token:string}` on success, `502 {error:string}` on ElevenLabs failure.

- [ ] **Step 1: Install dependencies**

Run: `npm install @elevenlabs/react @elevenlabs/elevenlabs-js`
Then verify the API surface used later: `grep -rln "getWebrtcToken" node_modules/@elevenlabs/elevenlabs-js/dist --include="*.d.ts" | head -3` and `grep -rn "useConversation\|sendUserMessage\|clientTools" node_modules/@elevenlabs/react/dist --include="*.d.ts" | head`. Expected: both found. If `useConversation` is absent, stop and report (Task 8 depends on it).

- [ ] **Step 2: Write the failing smoke test** — create `tests/spatial-smoke.mjs`

```js
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';let cookies={};
async function call(path,body,expect=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:base,Cookie:Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ')},...(body?{body:JSON.stringify(body)}:{})});for(const c of r.headers.getSetCookie()){const [k,v]=c.split(';')[0].split('=');cookies[k]=v;}const d=await r.json();assert.equal(r.status,expect,JSON.stringify(d));return d;}
const vt=await call('/api/voice/token');if(!process.env.ELEVENLABS_API_KEY){assert.equal(vt.demo,true);assert.equal('token' in vt,false);}else assert.ok(vt.token);
assert.equal(/sk_|agent_/.test(JSON.stringify(vt)),false,'keine Zugangsdaten im Client');
console.log('PASS: Voice-Token-Route.');
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run dev` in the background (leave it running for the rest of the plan), then `node tests/spatial-smoke.mjs`.
Expected: FAIL — 404 from `/api/voice/token`.

- [ ] **Step 4: Create `app/api/voice/token/route.ts`**

```ts
import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';
export const dynamic='force-dynamic';
export async function GET(){const apiKey=process.env.ELEVENLABS_API_KEY?.trim(),agentId=process.env.ELEVENLABS_AGENT_ID?.trim();if(!apiKey||!agentId)return Response.json({demo:true});
try{const client=new ElevenLabsClient({apiKey});const res=await client.conversationalAi.conversations.getWebrtcToken({agentId});return Response.json({token:res.token});}
catch{return Response.json({error:'Sprachverbindung nicht verfügbar. Bitte ElevenLabs-Konfiguration prüfen.'},{status:502});}}
```

- [ ] **Step 5: Create `.env.example`**

```
# Mistral (KI-Buddy) – optional, sonst Textsuche
MISTRAL_API_KEY=
MISTRAL_CHAT_MODEL=mistral-small-latest

# ElevenLabs Agents (Sprachanleitung in der Karte) – optional, sonst Demo-Modus
# Beide Werte bleiben serverseitig; niemals mit NEXT_PUBLIC_ präfixen.
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=

# Nur für Hosting (Vercel + Supabase)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_SECRET=
```

- [ ] **Step 6: Run smoke test**

Run: `node tests/spatial-smoke.mjs` — Expected: `PASS: Voice-Token-Route.`

- [ ] **Step 7: Commit**

```bash
git add app/api/voice/token/route.ts .env.example tests/spatial-smoke.mjs package.json package-lock.json
git commit -m "Add server-side ElevenLabs token route with demo fallback

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Map browsing — styles, FloorPlanMap, ProcessPanel, SpatialView, nav wiring

**Files:**
- Modify: `app/globals.css` (append)
- Create: `app/components/spatial/FloorPlanMap.tsx`
- Create: `app/components/spatial/ProcessPanel.tsx`
- Create: `app/components/spatial/SpatialView.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `ClientState`, `Role`, `Process` (`@/lib/types`); `FloorPlan`, `Room`, `Pin`, `Point`, `PinDraft`, `Feedback` (`@/lib/spatial/types`); `toNormalized`, `clamp01`, `roomAt` (`@/lib/spatial/geometry`); page's `action(body:any,success?:string):Promise<ClientState|undefined>`.
- Produces: `FloorPlanMap` props `{plan,rooms,pins,selectedId?,onSelectPin?,draft?:PinDraft,placing?:boolean,onDraftMove?:(p:Point)=>void,onDraftConfirm?:()=>void}`; `ProcessPanel` props `{pin,room?,processes,feedback:(Feedback&{processTitle:string})[],owner,busy,onStart:(processId:string)=>void,onEdit:()=>void}`; `SpatialView` props `{state:ClientState;role:Role;busy:boolean;action}`; `pad(n:number):string` exported from `ProcessPanel.tsx`. Tasks 6–8 add panels into `SpatialView` at the marked places.

- [ ] **Step 1: Append styles to `app/globals.css`**

```css
/* Karte (spatial) */
.sp{--sp-accent:#365e49;--sp-on-accent:#fffefa;--sp-soft:#e9eee3;--sp-pin:#a95736;--sp-on-pin:#fffefa;--sp-walls:#a8b29f;--sp-paper:#fff;--sp-floor:#fdfcf7;--sp-bed:#e8eddd;--sp-service:#f2ead6;--sp-living:#e6e9e5;--sp-furniture:#fffdf5;--sp-furn-line:#c1c5b5;--sp-warm:#f4e7dd;--sp-muted:var(--muted);--sp-line:var(--border)}
.sp-workspace{display:grid;grid-template-columns:minmax(0,1fr) 340px;background:var(--sp-paper);border:1px solid var(--sp-line);border-radius:var(--radius);overflow:hidden}
.sp-map-section{padding:18px 22px 16px;min-width:0}
.sp-map-header{display:flex;justify-content:space-between;align-items:center;gap:8px;color:var(--sp-muted);font-size:12px;flex-wrap:wrap}
.sp-map-header strong{color:var(--text);font-weight:600;font-size:13px}
.sp-map{position:relative;width:100%;max-width:400px;margin:14px auto 8px;isolation:isolate;user-select:none;-webkit-user-select:none}
.sp-map.sp-placing{cursor:crosshair;touch-action:none}
.sp-placing .sp-pin:not(.sp-draft){pointer-events:none;opacity:.55}
.sp-plan{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.sp-room{stroke:var(--sp-walls);stroke-width:4;stroke-linejoin:round;fill:var(--sp-living)}
.sp-room-bed{fill:var(--sp-bed)}.sp-room-service{fill:var(--sp-service)}
.sp-room-active{stroke:var(--sp-accent)}
.sp-connector{fill:var(--sp-living);stroke:var(--sp-walls);stroke-width:2}
.sp-furniture{fill:var(--sp-furniture);stroke:var(--sp-furn-line);stroke-width:1.5}
.sp-furniture-line{fill:none;stroke:var(--sp-furn-line);stroke-width:1.5}
.sp-door-gap{stroke:var(--sp-paper);stroke-width:5;fill:none}
.sp-door{stroke:var(--sp-furn-line);stroke-width:1.5;fill:none}
.sp-window-line{stroke:var(--sp-floor);stroke-width:2;fill:none}
.sp-room-label{position:absolute;pointer-events:none;color:var(--sp-muted);font-size:11px;line-height:1.25;transform:translate(-50%,-50%);white-space:nowrap}
.sp-pin{position:absolute;width:44px;height:48px;background:transparent;border:0;padding:0;transform:translate(-50%,-100%);z-index:3;display:flex;justify-content:center;align-items:flex-end;isolation:isolate;border-radius:50%}
.sp-pin::before{content:"";position:absolute;width:30px;height:30px;bottom:5px;background:var(--sp-accent);border:2px solid var(--sp-paper);border-radius:50% 50% 0 50%;transform:rotate(45deg);box-shadow:0 2px 6px #26332726;z-index:-1}
.sp-pin>span{display:flex;justify-content:center;align-items:center;height:36px;font-size:12px;font-weight:600;color:var(--sp-on-accent)}
.sp-pin.sp-selected::before{background:var(--sp-pin);box-shadow:0 0 0 5px #a9573626}
.sp-pin.sp-selected>span{color:var(--sp-on-pin)}
.sp-pin.sp-draft{cursor:move;touch-action:none}
.sp-pin.sp-draft::before{background:var(--sp-paper);border:2px dashed var(--sp-pin)}
.sp-pin.sp-draft>span{color:var(--sp-pin)}
.sp-map-footer{display:flex;gap:7px;align-items:center;justify-content:center;color:var(--sp-muted);font-size:11px}
.sp-panel{border-left:1px solid var(--sp-line);padding:25px 22px;min-width:0}
.sp-place-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.sp-place-number{color:var(--sp-pin);font-family:Georgia,'Times New Roman',serif;font-size:37px;line-height:1}
.sp-place-category{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--sp-muted)}
.sp-h2{font-size:23px;letter-spacing:-.5px;font-weight:600;margin-bottom:6px}
.sp-place-subtitle{color:var(--sp-muted);font-size:13px;margin:0 0 22px}
.sp-section-label{display:flex;align-items:center;gap:5px;font-size:11px;letter-spacing:1px;font-weight:600;color:var(--sp-muted);text-transform:uppercase;margin:16px 0 8px}
.sp-process{display:flex;align-items:center;width:100%;gap:11px;padding:15px 0;border:0;border-bottom:1px solid var(--sp-line);background:transparent;text-align:left;border-radius:0}
.sp-process:hover .sp-process-title{color:var(--sp-accent);text-decoration:underline;text-underline-offset:3px}
.sp-process-icon{display:grid;place-items:center;flex:none;width:35px;height:39px;background:var(--sp-soft);color:var(--sp-accent);border-radius:9px}
.sp-process-copy{flex:1;min-width:0}
.sp-process-title{display:block;font-size:14px;font-weight:600;line-height:1.4}
.sp-process-meta{display:block;color:var(--sp-muted);font-size:12px;margin-top:4px}
.sp-voice-hint{border-radius:10px;background:var(--sp-soft);color:var(--sp-accent);padding:14px;margin-top:22px;display:flex;align-items:flex-start;gap:10px;font-size:13px;font-weight:600}
.sp-voice-hint span{display:block;color:var(--sp-muted);font-size:12px;font-weight:400;margin-top:3px}
.sp-confirmed{display:flex;gap:7px;align-items:center;color:var(--sp-muted);font-size:11px;margin-top:16px}
.sp-tag{display:inline-flex;align-items:center;gap:6px;background:var(--sp-soft);color:var(--sp-accent);border-radius:6px;padding:6px 9px;font-size:12px;font-weight:600}
.sp-wide{width:100%;justify-content:center;margin-top:10px}
.sp-location{display:flex;gap:8px;align-items:center;padding:8px 0 2px;color:var(--sp-muted);font-size:12px}
.sp-step-top{display:flex;justify-content:space-between;color:var(--sp-muted);font-size:12px;margin:14px 0 10px}
.sp-step-track{display:flex;gap:5px;margin-bottom:22px}
.sp-step-track span{height:4px;flex:1;border-radius:3px;background:var(--sp-line)}
.sp-step-track span.sp-past{background:var(--sp-accent)}.sp-step-track span.sp-current{background:var(--sp-pin)}
.sp-instruction{font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.4;margin:10px 0 18px;letter-spacing:-.3px}
.sp-caution{background:var(--sp-warm);border-radius:8px;padding:12px;display:flex;gap:8px;font-size:13px;margin-bottom:18px;align-items:flex-start}
.sp-caution svg{color:var(--sp-pin)}
.sp-button-row{display:flex;gap:8px;margin-top:14px}.sp-button-row .primary{flex:1}
.sp-exit{margin-top:8px}
.sp-voice{margin-top:12px}
.sp-wave{height:54px;display:flex;justify-content:center;align-items:center;gap:4px;color:var(--sp-line)}
.sp-wave.sp-speaking{color:var(--sp-accent)}
.sp-wave span{display:block;width:4px;border-radius:5px;background:currentColor;transition:color .2s}
.sp-voice-status{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--sp-muted);font-size:12px;text-align:center;flex-wrap:wrap}
.sp-voice-demo{background:var(--sp-warm);border-radius:10px;padding:12px 14px;font-size:12px;display:grid;gap:6px}
.sp-voice-demo strong{font-size:13px}.sp-voice-demo span{color:var(--sp-muted)}
.sp-voice-error{background:#fbe9e4}
.sp-spin{animation:sp-spin 1s linear infinite}@keyframes sp-spin{to{transform:rotate(360deg)}}
.sp-form-label{display:block;font-size:13px;font-weight:600;margin:18px 0 6px}
.sp-input{width:100%;font-size:16px}
.sp-check{display:flex;align-items:flex-start;gap:9px;padding:9px 0;font-size:13px;font-weight:500;margin:0;border-bottom:1px solid var(--sp-line)}
.sp-check input{display:inline-block;accent-color:var(--sp-accent);width:18px;height:18px;flex:none;margin:1px 0 0}
.sp-check span small{display:block;color:var(--sp-muted);font-size:11px;font-weight:400;margin-top:2px}
.sp-position-note{font-size:12px;color:var(--sp-muted);margin:8px 0 0}
.sp-status{color:var(--sp-accent);font-size:13px;margin-top:12px;min-height:18px}
.sp-status[data-error=true]{color:var(--sp-pin)}
.sp-owner-actions{margin-top:16px;border-top:1px solid var(--sp-line);padding-top:14px;display:grid;gap:4px}
.sp-feedback-list{margin-top:12px}
.sp-feedback-item{padding:10px 0;border-bottom:1px solid var(--sp-line);font-size:13px}
.sp-feedback-item p{margin:4px 0}.sp-feedback-item span{color:var(--sp-muted);font-size:11px}
@media(max-width:900px){.sp-workspace{grid-template-columns:1fr}.sp-panel{border-left:0;border-top:1px solid var(--sp-line);padding:20px 16px}.sp-map-section{padding:14px 12px}.sp-map{max-width:360px}}
```

- [ ] **Step 2: Create `app/components/spatial/FloorPlanMap.tsx`**

```tsx
'use client';
import {useRef,KeyboardEvent,PointerEvent} from 'react';
import {Plus} from 'lucide-react';
import type {FloorPlan,Room,Pin,Point,PinDraft} from '@/lib/spatial/types';
import {toNormalized,clamp01} from '@/lib/spatial/geometry';
type Props={plan:FloorPlan;rooms:Room[];pins:Pin[];selectedId?:string;onSelectPin?:(id:string)=>void;draft?:PinDraft;placing?:boolean;onDraftMove?:(p:Point)=>void;onDraftConfirm?:()=>void};
export const pad=(n:number)=>String(n).padStart(2,'0');
const pct=(n:number)=>`${(n*100).toFixed(3)}%`;
export default function FloorPlanMap({plan,rooms,pins,selectedId,onSelectPin,draft,placing,onDraftMove,onDraftConfirm}:Props){
const ref=useRef<HTMLDivElement>(null);const dragging=useRef(false);
const W=plan.width,H=plan.height;
const point=(e:{clientX:number;clientY:number})=>toNormalized(e.clientX,e.clientY,ref.current!.getBoundingClientRect());
const roomName=(id:string)=>rooms.find(r=>r.id===id)?.name||'';
const down=(e:PointerEvent<HTMLDivElement>)=>{if(!placing||!onDraftMove)return;dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);onDraftMove(point(e));};
const move=(e:PointerEvent<HTMLDivElement>)=>{if(dragging.current&&onDraftMove)onDraftMove(point(e));};
const up=()=>{dragging.current=false;};
const keys=(e:KeyboardEvent<HTMLButtonElement>)=>{if(!draft)return;const step=e.shiftKey?.05:.01;const d:Record<string,[number,number]>={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};const m=d[e.key];if(m&&onDraftMove){e.preventDefault();onDraftMove({x:clamp01(draft.x+m[0]),y:clamp01(draft.y+m[1])});}else if((e.key==='Enter'||e.key===' ')&&onDraftConfirm){e.preventDefault();onDraftConfirm();}};
return <div ref={ref} className={`sp-map ${placing?'sp-placing':''}`} style={{aspectRatio:`${W} / ${H}`}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
<svg className="sp-plan" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Schematischer Grundriss ${plan.title}. Räume: ${rooms.map(r=>r.name).join(', ')}. Möbel und Positionen sind Beispiele.`}>
{rooms.map(r=><polygon key={r.id} className={`sp-room sp-room-${r.tone}`} points={r.polygon.map(([x,y])=>`${(x*W).toFixed(1)},${(y*H).toFixed(1)}`).join(' ')}/>)}
<g dangerouslySetInnerHTML={{__html:plan.geometry}}/>
</svg>
{rooms.map(r=><span key={r.id} className="sp-room-label" style={{left:pct(r.label.x),top:pct(r.label.y)}}>{r.name}</span>)}
{pins.map(p=><button key={p.id} type="button" className={`sp-pin ${p.id===selectedId?'sp-selected':''}`} style={{left:pct(p.x),top:pct(p.y)}} aria-pressed={p.id===selectedId} aria-label={`${pad(p.number)} ${p.name}, ${roomName(p.roomId)}`} onClick={()=>onSelectPin?.(p.id)}><span>{pad(p.number)}</span></button>)}
{draft&&<button type="button" className="sp-pin sp-draft" style={{left:pct(draft.x),top:pct(draft.y)}} aria-label={`Neuer Pin${draft.name?` „${draft.name}“`:''}. Mit den Pfeiltasten verschieben, Enter bestätigt.`} onKeyDown={keys}><span><Plus size={15}/></span></button>}
</div>;}
```

Note: `plan.geometry` is seeded, server-owned SVG; it is not editable through any client action, so `dangerouslySetInnerHTML` renders only our own asset.

- [ ] **Step 3: Create `app/components/spatial/ProcessPanel.tsx`**

```tsx
'use client';
import {MapPin,ArrowUpRight,AudioLines,BadgeCheck,Pencil,MessageSquare} from 'lucide-react';
import type {Process} from '@/lib/types';import {roleNames} from '@/lib/types';
import type {Pin,Room,Feedback} from '@/lib/spatial/types';
import {pad} from './FloorPlanMap';
type Props={pin:Pin;room?:Room;processes:Process[];feedback:(Feedback&{processTitle:string})[];owner:boolean;busy:boolean;onStart:(processId:string)=>void;onEdit:()=>void};
export default function ProcessPanel({pin,room,processes,feedback,owner,busy,onStart,onEdit}:Props){
return <>
<div className="sp-place-top"><span className="sp-place-number">{pad(pin.number)}</span><span className="sp-place-category"><MapPin size={14}/>{room?.name||'Raum unbekannt'}</span></div>
<h2 className="sp-h2">{pin.name}</h2>
<p className="sp-place-subtitle">Das Wissen für genau diesen Ort.</p>
<div className="sp-section-label">{processes.length} relevante Prozesse</div>
<div>{processes.map(p=><button key={p.id} type="button" className="sp-process" disabled={busy} onClick={()=>onStart(p.id)}><span className="sp-process-icon"><AudioLines size={17}/></span><span className="sp-process-copy"><span className="sp-process-title">{p.title}</span><span className="sp-process-meta">{p.steps.length} Schritte{p.minutes?` · ca. ${p.minutes} Min.`:''}</span></span><ArrowUpRight size={14}/></button>)}{!processes.length&&<p className="muted">Für diesen Ort sind noch keine Prozesse freigegeben.</p>}</div>
<div className="sp-voice-hint"><AudioLines size={18}/><div>Schritt für Schritt begleitet<span>Öffne einen Prozess für die Sprachanleitung.</span></div></div>
{owner?<><button type="button" className="button ghost sp-wide" onClick={onEdit} disabled={busy}><Pencil size={16}/>Pin bearbeiten</button>
{feedback.length>0&&<div className="sp-feedback-list"><div className="sp-section-label"><MessageSquare size={12}/>Feedback vom Team</div>{feedback.slice(0,5).map(f=><div key={f.id} className="sp-feedback-item"><strong>{f.processTitle}</strong><p>{f.comment}</p><span>{new Date(f.created).toLocaleDateString('de-DE')} · {roleNames[f.role]}</span></div>)}</div>}</>
:<div className="sp-confirmed"><BadgeCheck size={13}/>Von der Betreiberin freigegeben</div>}
</>;}
```

- [ ] **Step 4: Create `app/components/spatial/SpatialView.tsx`** (map + process list only; Tasks 6–8 fill the marked slots)

```tsx
'use client';
import {useMemo,useState} from 'react';
import {MapPin,Plus} from 'lucide-react';
import type {ClientState,Role,Process} from '@/lib/types';
import type {Pin,Point,PinDraft} from '@/lib/spatial/types';
import {roomAt} from '@/lib/spatial/geometry';
import FloorPlanMap from './FloorPlanMap';
import ProcessPanel from './ProcessPanel';
type Mode={kind:'map'}|{kind:'guide';sessionId:string}|{kind:'feedback';sessionId:string}|{kind:'edit'};
type Props={state:ClientState;role:Role;busy:boolean;action:(body:any,success?:string)=>Promise<ClientState|undefined>};
export default function SpatialView({state,role,busy,action}:Props){
const plan=state.floorPlans[0];
const rooms=useMemo(()=>state.rooms.filter(r=>r.floorPlanId===plan?.id),[state.rooms,plan?.id]);
const pins=useMemo(()=>state.pins.filter(p=>p.floorPlanId===plan?.id),[state.pins,plan?.id]);
const active=state.guidance.find(g=>g.status==='active'&&g.role===role);
const [mode,setMode]=useState<Mode>(()=>active?{kind:'guide',sessionId:active.id}:{kind:'map'});
const [selectedId,setSelectedId]=useState(active?.pinId||pins[0]?.id||'');
const [draft,setDraft]=useState<PinDraft>();
const [placing,setPlacing]=useState(false);
const [status,setStatus]=useState<{text:string;error?:boolean}>({text:''});
const [repeatKey,setRepeatKey]=useState(0);
const selected=pins.find(p=>p.id===selectedId);
const roomOf=(pin?:{roomId:string})=>rooms.find(r=>r.id===pin?.roomId);
const processOf=(id:string)=>state.processes.find(p=>p.id===id);
const session=mode.kind==='guide'||mode.kind==='feedback'?state.guidance.find(g=>g.id===mode.sessionId):undefined;
const sessionPin=session?pins.find(p=>p.id===session.pinId):undefined;
const draftRoom=draft&&plan?roomAt(rooms,plan.id,draft):undefined;
async function startGuidance(processId:string){if(!selected)return;const st=await action({type:'guidance-start',pinId:selected.id,processId},'');const g=st?.guidance.find(g=>g.status==='active'&&g.role===role);if(g)setMode({kind:'guide',sessionId:g.id});}
async function stepOp(op:'next'|'exit'){if(!session)return;const st=await action({type:'guidance-step',id:session.id,op},'');const g=st?.guidance.find(g=>g.id===session.id);if(!g)return;if(op==='exit')setMode({kind:'map'});else if(g.status==='done')setMode({kind:'feedback',sessionId:g.id});}
async function sendFeedback(comment:string){if(!session)return;const st=await action({type:'guidance-feedback',sessionId:session.id,comment},'Feedback an die Betreiberin gesendet');if(st)setMode({kind:'map'});}
function openEditor(pin?:Pin){setDraft(pin?{id:pin.id,name:pin.name,x:pin.x,y:pin.y,processIds:[...pin.processIds]}:{name:'',x:.5,y:.5,processIds:[]});setPlacing(!pin);setStatus({text:pin?'':'Tippe auf die Karte, um den Pin zu platzieren.'});setMode({kind:'edit'});}
function moveDraft(p:Point){if(!draft||!plan)return;const room=roomAt(rooms,plan.id,p);if(!room){setStatus({text:'Bitte eine Position innerhalb eines Raums wählen.',error:true});return;}setDraft({...draft,x:p.x,y:p.y});setStatus({text:`Position: ${room.name}`});}
async function saveDraft(){if(!draft||!plan)return;const name=draft.name.trim();if(!name){setStatus({text:'Bitte gib dem Ort einen Namen.',error:true});return;}if(!draft.processIds.length){setStatus({text:'Wähle mindestens einen Prozess.',error:true});return;}if(!draftRoom){setStatus({text:'Bitte eine Position innerhalb eines Raums wählen.',error:true});return;}const st=await action({type:'pin-save',id:draft.id,floorPlanId:plan.id,name,x:draft.x,y:draft.y,processIds:draft.processIds},'Pin gespeichert');if(!st)return;const saved=draft.id?st.pins.find(p=>p.id===draft.id):st.pins[st.pins.length-1];setSelectedId(saved?.id||'');setDraft(undefined);setPlacing(false);setMode({kind:'map'});}
function cancelEditor(){setDraft(undefined);setPlacing(false);setMode({kind:'map'});}
if(!plan)return <div className="sp"><p className="muted">Für diese Wohnung ist noch kein Grundriss hinterlegt.</p></div>;
const heading=mode.kind==='edit'?{kicker:'WISSEN FÜR DEIN TEAM',title:'Dein Wissen bekommt einen Platz.',sub:'Platziere einen Pin dort, wo dein Team das Wissen braucht.'}:mode.kind==='guide'&&session?{kicker:'DEINE BEGLEITUNG VOR ORT',title:session.title,sub:'Die Anleitung bleibt mit dem Ort auf der Karte verbunden.'}:{kicker:'DEIN WISSEN VOR ORT',title:'Ein Ort. Die richtigen Handgriffe.',sub:'Wähle einen Pin und finde die Abläufe, die du hier brauchst.'};
let panel:React.ReactNode;
/* TASK 7: edit panel */
/* TASK 6: guide + feedback panels */
if(!panel)panel=selected?<ProcessPanel pin={selected} room={roomOf(selected)} processes={selected.processIds.map(processOf).filter(Boolean) as Process[]} feedback={role==='owner'?state.feedback.filter(f=>f.pinId===selected.id).map(f=>({...f,processTitle:processOf(f.processId)?.title||'Prozess'})):[]} owner={role==='owner'} busy={busy} onStart={startGuidance} onEdit={()=>openEditor(selected)}/>:<p className="muted">Wähle einen Pin auf der Karte.</p>;
return <div className="sp">
<div className="page-heading"><div><span className="eyebrow">{heading.kicker}</span><h1>{heading.title}</h1><p>{heading.sub}</p></div>{role==='owner'&&mode.kind==='map'&&<button className="button primary" disabled={busy} onClick={()=>openEditor()}><Plus size={18}/>Pin anlegen</button>}</div>
<div className="sp-workspace">
<section className="sp-map-section" aria-label="Grundriss und Wissenspunkte">
<div className="sp-map-header"><strong>{plan.title}</strong><span>{mode.kind==='edit'?(placing?'Position wählen':'Pin bearbeiten'):mode.kind==='guide'&&sessionPin?`Aktueller Ort · ${sessionPin.name}`:`${pins.length} Wissenspunkte`}</span></div>
<FloorPlanMap plan={plan} rooms={rooms} pins={pins.filter(p=>!(mode.kind==='edit'&&p.id===draft?.id))} selectedId={mode.kind==='edit'?undefined:(sessionPin?.id||selectedId)} onSelectPin={id=>{if(mode.kind==='guide'||mode.kind==='feedback')return;setSelectedId(id);if(mode.kind==='edit'&&role==='owner'){const pin=pins.find(p=>p.id===id);if(pin)openEditor(pin);}}} draft={mode.kind==='edit'?draft:undefined} placing={mode.kind==='edit'&&placing} onDraftMove={moveDraft} onDraftConfirm={()=>{setPlacing(false);setStatus({text:draftRoom?`Position übernommen: ${draftRoom.name}`:''});}}/>
<div className="sp-map-footer"><MapPin size={13}/><span>Schematischer Grundriss · Möbel sind Beispiele</span></div>
</section>
<aside className="sp-panel" aria-live="polite">{panel}</aside>
</div>
</div>;}
```

`stepOp`, `sendFeedback`, `cancelEditor`, `saveDraft`, `repeatKey`/`setRepeatKey` are unused until Tasks 6–7; TypeScript does not error on unused locals in this config.

- [ ] **Step 5: Wire `app/page.tsx`** (exact edits)

1. Replace `type View='overview'|'knowledge'|'processes'|'inbox'|'care'|'rewards'|'settings'|'buddy';` with `type View='overview'|'knowledge'|'processes'|'map'|'inbox'|'care'|'rewards'|'settings'|'buddy';`
2. Replace the line starting `type ClientState=Omit<State,'settings'|'handover'>` (entire line) with nothing, and change `import type {State,Role,Entry,Process,Contribution,Run,Step} from '@/lib/types';` to `import type {ClientState,Role,Entry,Process,Contribution,Run,Step} from '@/lib/types';` (if `npx tsc --noEmit` then reports `State` as missing elsewhere in the file, add `State` back to that import)
3. In the lucide import, add `Map as MapIcon` (e.g. after `ClipboardCheck`).
4. After the lucide import line add: `import SpatialView from './components/spatial/SpatialView';`
5. In `const nav=[...]`, after `{id:'processes',label:'Prozesse',icon:Workflow},` insert `{id:'map',label:'Karte',icon:MapIcon},`
6. Directly before `{view==='buddy'&&<><div className="buddy-heading">` insert: `{view==='map'&&<SpatialView state={s} role={role} busy={busy} action={action}/>}`

- [ ] **Step 6: Verify in the browser**

With `npm run dev` running, open http://localhost:3000, click „Karte". Expected: floor plan with six numbered pins; clicking a pin highlights it and lists its processes with step count and minutes; „Waschbecken" and „Toilette" (both Bad) list different processes. Switch role to „Mira" — „Karte" visible, no „Pin anlegen"/„Pin bearbeiten". Resize to 390 px wide: layout stacks, pins stay on the same spots. Run `npx tsc --noEmit` — Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css app/components/spatial/FloorPlanMap.tsx app/components/spatial/ProcessPanel.tsx app/components/spatial/SpatialView.tsx app/page.tsx
git commit -m "Add Karte view with floor plan, pins, and process panel

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Guidance panel and feedback form (manual controls)

**Files:**
- Create: `app/components/spatial/GuidancePanel.tsx`
- Create: `app/components/spatial/FeedbackForm.tsx`
- Modify: `app/components/spatial/SpatialView.tsx` (replace the `/* TASK 6 */` marker)

**Interfaces:**
- Produces: `GuidancePanel` props `{session:GuidanceSession;pin:Pin;room?:Room;busy:boolean;onNext:()=>void;onRepeat:()=>void;onExit:()=>void;voice:ReactNode}`; `FeedbackForm` props `{session:GuidanceSession;pin:Pin;busy:boolean;onSubmit:(comment:string)=>void;onSkip:()=>void}`. Task 8 supplies the `voice` node; until then pass `null`.

- [ ] **Step 1: Create `app/components/spatial/GuidancePanel.tsx`**

```tsx
'use client';
import type {ReactNode} from 'react';
import {MapPin,ArrowRight,RotateCcw,ShieldAlert,X} from 'lucide-react';
import type {GuidanceSession,Pin,Room} from '@/lib/spatial/types';
type Props={session:GuidanceSession;pin:Pin;room?:Room;busy:boolean;onNext:()=>void;onRepeat:()=>void;onExit:()=>void;voice:ReactNode};
export default function GuidancePanel({session,pin,room,busy,onNext,onRepeat,onExit,voice}:Props){
const n=session.steps.length,i=Math.min(session.step,n-1),step=session.steps[i],last=i===n-1;
return <>
<div className="sp-location"><MapPin size={14}/>{pin.name}{room?` · ${room.name}`:''}</div>
<div className="sp-step-top"><span>Schritt {i+1} von {n}</span>{session.minutes?<span>ca. {session.minutes} Min. gesamt</span>:null}</div>
<div className="sp-step-track" role="progressbar" aria-valuemin={1} aria-valuemax={n} aria-valuenow={i+1} aria-label={`Schritt ${i+1} von ${n}`}>{session.steps.map((s,j)=><span key={s.id} className={j<i?'sp-past':j===i?'sp-current':''}/>)}</div>
<h2 className="sp-h2">{step.title}</h2>
<div className="sp-instruction" aria-live="polite">„{step.body}“</div>
{step.caution&&<div className="sp-caution"><ShieldAlert size={16}/><span>{step.caution}</span></div>}
{voice}
<div className="sp-button-row"><button type="button" className="button ghost" onClick={onRepeat} disabled={busy}><RotateCcw size={16}/>Wiederholen</button><button type="button" className="button primary" onClick={onNext} disabled={busy}>{last?'Prozess abschließen':'Schritt erledigt'}<ArrowRight size={16}/></button></div>
<button type="button" className="button ghost sp-wide sp-exit" onClick={onExit} disabled={busy}><X size={16}/>Anleitung beenden</button>
</>;}
```

- [ ] **Step 2: Create `app/components/spatial/FeedbackForm.tsx`**

```tsx
'use client';
import {useState} from 'react';
import {Check,Send} from 'lucide-react';
import type {GuidanceSession,Pin} from '@/lib/spatial/types';
type Props={session:GuidanceSession;pin:Pin;busy:boolean;onSubmit:(comment:string)=>void;onSkip:()=>void};
export default function FeedbackForm({session,pin,busy,onSubmit,onSkip}:Props){
const [comment,setComment]=useState('');const [error,setError]=useState('');
return <form className="sp-end-form" onSubmit={e=>{e.preventDefault();if(!comment.trim()){setError('Ergänze kurz dein Feedback oder kehre zur Karte zurück.');return;}onSubmit(comment.trim());}}>
<div className="sp-place-top"><span className="sp-process-icon"><Check size={18}/></span><span className="sp-tag">Abgeschlossen</span></div>
<h2 className="sp-h2">Gut gemacht.</h2>
<p className="sp-place-subtitle">„{session.title}“ am Ort „{pin.name}“ ist erledigt.</p>
<label className="sp-form-label" htmlFor="sp-feedback">Was hat gut geklappt? Was hat gefehlt?</label>
<textarea id="sp-feedback" className="sp-input" rows={4} maxLength={2000} value={comment} onChange={e=>{setComment(e.target.value);setError('');}} placeholder="Dein Feedback zur Anleitung …"/>
<div className="sp-status" role="status" data-error={!!error}>{error}</div>
<div className="sp-owner-actions"><button className="button primary sp-wide" type="submit" disabled={busy}><Send size={16}/>Feedback an die Betreiberin</button><button className="button ghost sp-wide" type="button" onClick={onSkip} disabled={busy}>Zur Karte</button></div>
</form>;}
```

- [ ] **Step 3: Mount in `SpatialView.tsx`**

Add imports: `import GuidancePanel from './GuidancePanel';import FeedbackForm from './FeedbackForm';`

Replace the line `/* TASK 6: guide + feedback panels */` with:

```tsx
if(mode.kind==='guide'&&session&&sessionPin)panel=<GuidancePanel session={session} pin={sessionPin} room={roomOf(sessionPin)} busy={busy} onNext={()=>stepOp('next')} onRepeat={()=>setRepeatKey(k=>k+1)} onExit={()=>stepOp('exit')} voice={null}/>;
else if(mode.kind==='feedback'&&session&&sessionPin)panel=<FeedbackForm session={session} pin={sessionPin} busy={busy} onSubmit={sendFeedback} onSkip={()=>setMode({kind:'map'})}/>;
```

- [ ] **Step 4: Verify in the browser**

As Mira: Karte → Waschbecken → „Waschbecken reinigen". Expected: heading becomes the process title, map context says „Aktueller Ort · Waschbecken", pins are not selectable, step 1 of 4 with caution box. „Schritt erledigt" ×3 → button reads „Prozess abschließen" → feedback form → submit → toast „Feedback an die Betreiberin gesendet" → back to map. Reload mid-guidance: the session resumes at the same step. „Anleitung beenden" returns to the map. Switch to Lena → Waschbecken: feedback appears under „Feedback vom Team".

- [ ] **Step 5: Commit**

```bash
git add app/components/spatial/GuidancePanel.tsx app/components/spatial/FeedbackForm.tsx app/components/spatial/SpatialView.tsx
git commit -m "Add step-by-step guidance panel and feedback form

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Owner pin editor

**Files:**
- Create: `app/components/spatial/PinEditor.tsx`
- Modify: `app/components/spatial/SpatialView.tsx` (replace the `/* TASK 7 */` marker)

**Interfaces:**
- Produces: `PinEditor` props `{draft:PinDraft;room?:Room;processes:Process[];placing:boolean;busy:boolean;status:{text:string;error?:boolean};onChange:(d:PinDraft)=>void;onTogglePlacing:()=>void;onSave:()=>void;onCancel:()=>void}`.

- [ ] **Step 1: Create `app/components/spatial/PinEditor.tsx`**

```tsx
'use client';
import {Check,MapPin,Move} from 'lucide-react';
import type {Process} from '@/lib/types';
import type {Room,PinDraft} from '@/lib/spatial/types';
type Props={draft:PinDraft;room?:Room;processes:Process[];placing:boolean;busy:boolean;status:{text:string;error?:boolean};onChange:(d:PinDraft)=>void;onTogglePlacing:()=>void;onSave:()=>void;onCancel:()=>void};
export default function PinEditor({draft,room,processes,placing,busy,status,onChange,onTogglePlacing,onSave,onCancel}:Props){
const toggle=(id:string,on:boolean)=>onChange({...draft,processIds:on?[...draft.processIds,id]:draft.processIds.filter(x=>x!==id)});
return <form onSubmit={e=>{e.preventDefault();onSave();}}>
<div className="sp-place-top"><span className="sp-tag">{draft.id?'Pin bearbeiten':'Neuer Wissenspunkt'}</span></div>
<h2 className="sp-h2">Wissen verorten.</h2>
<p className="sp-place-subtitle">Ein genauer Ort. Die passenden Abläufe.</p>
<label className="sp-form-label" htmlFor="sp-pin-name">Wie heißt dieser Ort?</label>
<input id="sp-pin-name" className="sp-input" value={draft.name} maxLength={60} placeholder="z. B. Materialschrank" onChange={e=>onChange({...draft,name:e.target.value})}/>
<div className="sp-location"><MapPin size={14}/><span>{room?room.name:'Noch kein Raum – Position auf der Karte wählen'}</span></div>
<button className="button ghost sp-wide" type="button" onClick={onTogglePlacing} aria-pressed={placing}><Move size={16}/>{placing?'Position übernehmen':'Position auf der Karte ändern'}</button>
<p className="sp-position-note">Tippe auf die Karte oder ziehe den Pin. Mit Tastatur: Pin fokussieren, Pfeiltasten bewegen (Shift = größere Schritte), Enter bestätigt.</p>
<label className="sp-form-label">Welche Prozesse gehören hierher?</label>
<div>{processes.map(p=><label key={p.id} className="sp-check"><input type="checkbox" checked={draft.processIds.includes(p.id)} onChange={e=>toggle(p.id,e.target.checked)}/><span>{p.title}<small>{p.steps.length} Schritte{p.minutes?` · ca. ${p.minutes} Min.`:''}</small></span></label>)}</div>
<div className="sp-status" role="status" data-error={!!status.error}>{status.text}</div>
<div className="sp-owner-actions"><button type="submit" className="button primary sp-wide" disabled={busy}><Check size={16}/>Pin speichern</button><button type="button" className="button ghost sp-wide" onClick={onCancel} disabled={busy}>Abbrechen</button></div>
</form>;}
```

- [ ] **Step 2: Mount in `SpatialView.tsx`**

Add import: `import PinEditor from './PinEditor';`

Replace `/* TASK 7: edit panel */` with:

```tsx
if(mode.kind==='edit'&&draft)panel=<PinEditor draft={draft} room={draftRoom} processes={state.processes} placing={placing} busy={busy} status={status} onChange={setDraft} onTogglePlacing={()=>{setPlacing(!placing);setStatus({text:placing?(draftRoom?`Position übernommen: ${draftRoom.name}`:''):'Tippe auf die Karte oder ziehe den Pin.'});}} onSave={saveDraft} onCancel={cancelEditor}/>;
```

The branches are mutually exclusive by `mode.kind`, so the order `if(edit) … if(guide) … else if(feedback) … if(!panel) …` is correct as written.

- [ ] **Step 3: Verify in the browser**

As Lena: „Pin anlegen" → dashed draft pin at the centre (Bad), status „Tippe auf die Karte …". Tap in the Flur → status „Position: Flur"; tap outside the plan (corner) → error „Bitte eine Position innerhalb eines Raums wählen." and the pin does not move. Drag the pin with the mouse; on a phone-width viewport drag with touch emulation. Focus the draft pin, press arrow keys → moves; Enter → placing off. Save with empty name → „Bitte gib dem Ort einen Namen."; with no process → „Wähle mindestens einen Prozess."; with name „Materialschrank" + „Verbrauchsmaterial auffüllen" → toast, pin 07 in Flur selected. Reload → still there. Switch to Mira → pin 07 visible with that process. Back to Lena → tap pin 07 → „Pin bearbeiten" → rename → save → updated.

- [ ] **Step 4: Commit**

```bash
git add app/components/spatial/PinEditor.tsx app/components/spatial/SpatialView.tsx
git commit -m "Add owner pin editor with pointer, touch, and keyboard placement

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Voice session (ElevenLabs) with demo mode, and agent documentation

**Files:**
- Create: `app/components/spatial/VoiceSession.tsx`
- Modify: `app/components/spatial/SpatialView.tsx` (`voice={null}` → `<VoiceSession …/>`)
- Create: `docs/elevenlabs-agent.md`

**Interfaces:**
- Consumes: `useConversation` from `@elevenlabs/react` (verified in Task 4); `GET /api/voice/token` (Task 4).
- Produces: `VoiceSession` props `{session:GuidanceSession;pin:Pin;room?:Room;repeatKey:number;onNext:()=>void;onExit:()=>void}`. Client tool names the agent must define: `next_step`, `repeat_step`, `end_guidance`. Dynamic variables: `location, room, process_title, total_steps, step_index, step_title, step_instruction, step_caution, steps_json`.

- [ ] **Step 1: Create `app/components/spatial/VoiceSession.tsx`**

```tsx
'use client';
import {useEffect,useRef,useState} from 'react';
import {useConversation} from '@elevenlabs/react';
import {Mic,AudioLines,Loader2} from 'lucide-react';
import type {GuidanceSession,Pin,Room} from '@/lib/spatial/types';
type Props={session:GuidanceSession;pin:Pin;room?:Room;repeatKey:number;onNext:()=>void;onExit:()=>void};
type Voice='idle'|'connecting'|'connected'|'demo'|'error';
const cur=(s:GuidanceSession)=>Math.min(s.step,s.steps.length-1);
function stepText(s:GuidanceSession,i:number){const st=s.steps[i];return `Schritt ${i+1} von ${s.steps.length}: ${st.title}. ${st.body}${st.caution?` Achtung: ${st.caution}`:''}`;}
const canSpeak=()=>typeof window!=='undefined'&&'speechSynthesis' in window;
function say(text:string){if(!canSpeak())return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';speechSynthesis.speak(u);}
function hush(){if(canSpeak())speechSynthesis.cancel();}
export default function VoiceSession({session,pin,room,repeatKey,onNext,onExit}:Props){
const [voice,setVoice]=useState<Voice>('idle');const [detail,setDetail]=useState('');const [speak,setSpeak]=useState(false);
const latest=useRef({session,onNext,onExit});latest.current={session,onNext,onExit};
const agentStep=useRef<number|null>(null);const lastStep=useRef(session.step);const firstRepeat=useRef(repeatKey);
const conversation=useConversation({onConnect:()=>setVoice('connected'),onDisconnect:()=>setVoice(v=>v==='connected'||v==='connecting'?'idle':v),onError:(message:string)=>{setVoice('error');setDetail(message||'Verbindung unterbrochen.');}});
const conv=useRef(conversation);conv.current=conversation;
useEffect(()=>()=>{hush();conv.current.endSession().catch(()=>{});},[]);
useEffect(()=>{if(session.step===lastStep.current)return;lastStep.current=session.step;const i=cur(session);
if(voice==='connected'){if(agentStep.current===session.step){agentStep.current=null;return;}conversation.sendUserMessage(`Ich habe manuell zu Schritt ${i+1} gewechselt. Bitte lies mir nur diesen Schritt vor: ${stepText(session,i)}`);}
else if(voice==='demo'&&speak)say(stepText(session,i));
// eslint-disable-next-line react-hooks/exhaustive-deps
},[session.step]);
useEffect(()=>{if(repeatKey===firstRepeat.current)return;firstRepeat.current=repeatKey;if(voice==='connected')conversation.sendUserMessage('Bitte wiederhole den aktuellen Schritt.');else if(voice==='demo'&&speak)say(stepText(session,cur(session)));
// eslint-disable-next-line react-hooks/exhaustive-deps
},[repeatKey]);
async function start(){setDetail('');setVoice('connecting');
try{await navigator.mediaDevices.getUserMedia({audio:true});}catch{setVoice('error');setDetail('Mikrofonzugriff wurde nicht erlaubt.');return;}
let token='';try{const r=await fetch('/api/voice/token');const d=await r.json();if(d.demo){setVoice('demo');setDetail('Keine ElevenLabs-Zugangsdaten hinterlegt.');return;}if(!r.ok||!d.token)throw Error(d.error||'Token fehlt.');token=d.token;}catch(e:any){setVoice('error');setDetail(e.message);return;}
const s=latest.current.session,i=cur(s);
try{await conversation.startSession({conversationToken:token,connectionType:'webrtc',
dynamicVariables:{location:pin.name,room:room?.name||'',process_title:s.title,total_steps:s.steps.length,step_index:i+1,step_title:s.steps[i].title,step_instruction:s.steps[i].body,step_caution:s.steps[i].caution||'',steps_json:JSON.stringify(s.steps.map((st,k)=>({nr:k+1,titel:st.title,anweisung:st.body,hinweis:st.caution||''})))},
clientTools:{
next_step:async()=>{const g=latest.current.session;if(g.status!=='active')return 'Die Anleitung ist bereits abgeschlossen.';const nx=g.step+1;agentStep.current=nx;latest.current.onNext();return nx>=g.steps.length?'Der letzte Schritt ist erledigt. Der Prozess ist abgeschlossen. Bitte bedanke dich kurz und bitte um Feedback im Formular.':stepText(g,nx);},
repeat_step:async()=>stepText(latest.current.session,cur(latest.current.session)),
end_guidance:async()=>{latest.current.onExit();return 'Die Anleitung wurde beendet.';}}});}
catch(e:any){setVoice('error');setDetail(e?.message||'Sprachverbindung fehlgeschlagen.');}}
const i=cur(session);
return <div className="sp-voice">
{voice==='idle'&&<button type="button" className="button primary sp-wide" onClick={start}><Mic size={16}/>Sprachanleitung starten</button>}
{voice==='connecting'&&<div className="sp-voice-status"><Loader2 size={16} className="sp-spin"/>Verbindung wird aufgebaut …</div>}
{voice==='connected'&&<><div className={`sp-wave ${conversation.isSpeaking?'sp-speaking':''}`} aria-hidden="true">{[9,15,25,17,38,48,29,20,34,43,24,15,29,17,9].map((h,k)=><span key={k} style={{height:h}}/>)}</div><div className="sp-voice-status"><AudioLines size={14}/>{conversation.isSpeaking?'Assistent spricht …':'Assistent hört zu. Sag „weiter“, „nochmal“ oder „beenden“.'}<button type="button" className="text-button" onClick={()=>conversation.endSession()}>Stopp</button></div></>}
{voice==='demo'&&<div className="sp-voice-demo" role="status"><strong>Demo-Modus · keine Sprachverbindung</strong><span>{detail} Die Schritte lassen sich manuell steuern.</span><label className="sp-check"><input type="checkbox" checked={speak} onChange={e=>{setSpeak(e.target.checked);if(e.target.checked)say(stepText(session,i));else hush();}}/><span>Browser-Sprachausgabe (simuliert)</span></label></div>}
{voice==='error'&&<div className="sp-voice-demo sp-voice-error" role="alert"><strong>Sprachverbindung nicht verfügbar</strong><span>{detail} Die manuelle Anleitung funktioniert weiterhin.</span><button type="button" className="text-button" onClick={start}>Erneut versuchen</button></div>}
</div>;}
```

If `npx tsc --noEmit` reports that `startSession` does not accept `clientTools` or `connectionType` in the installed version, move `clientTools` into the `useConversation({...})` options object (same shape) and drop `connectionType` — both are documented variants; keep whichever compiles, and note it in the final report.

- [ ] **Step 2: Mount in `SpatialView.tsx`**

Add import: `import VoiceSession from './VoiceSession';`

In the Task 6 `GuidancePanel` line replace `voice={null}` with:

```tsx
voice={<VoiceSession key={session.id} session={session} pin={sessionPin} room={roomOf(sessionPin)} repeatKey={repeatKey} onNext={()=>stepOp('next')} onExit={()=>stepOp('exit')}/>}
```

The `key={session.id}` guarantees a switched process or pin unmounts the old voice session (its cleanup calls `endSession`) and mounts a fresh one with the new dynamic variables.

- [ ] **Step 3: Create `docs/elevenlabs-agent.md`**

```markdown
# ElevenLabs-Agent für die Sprachanleitung

Die Karte startet pro Anleitung eine WebRTC-Sitzung mit einem ElevenLabs-Agent. Der Browser erhält nur ein kurzlebiges Conversation-Token von `GET /api/voice/token`; API-Key und Agent-ID bleiben auf dem Server.

## Umgebungsvariablen (Server)

- `ELEVENLABS_API_KEY` – API-Key des Workspaces
- `ELEVENLABS_AGENT_ID` – ID des unten beschriebenen Agents

Fehlt einer der Werte, zeigt die Anleitung „Demo-Modus · keine Sprachverbindung“; alle manuellen Bedienelemente funktionieren weiterhin.

## Agent-Konfiguration (ElevenLabs Dashboard → Agents)

**Sprache:** Deutsch. **Erste Nachricht:**

```
Hallo! Wir sind am Ort {{location}} im Raum {{room}}. Ich begleite dich durch „{{process_title}}“ mit {{total_steps}} Schritten. Schritt {{step_index}}: {{step_title}}. {{step_instruction}} {{step_caution}} Sag „weiter“, wenn du fertig bist.
```

**System-Prompt:**

```
Du bist die Sprachbegleitung der App Hauswissen für Mitarbeitende in Ferienwohnungen. Du sprichst Deutsch, kurz und freundlich, per Du.
Ort: {{location}} ({{room}}). Prozess: {{process_title}} mit {{total_steps}} Schritten. Aktueller Schritt: {{step_index}}.
Alle Schritte als JSON: {{steps_json}}
Regeln:
- Lies immer nur den aktuellen Schritt vor (Titel, Anweisung, Hinweis). Erfinde keine zusätzlichen Schritte oder Regeln.
- Sagt die Person „weiter“, „fertig“, „erledigt“ oder Ähnliches, rufe das Tool next_step auf und lies genau den Text vor, den das Tool zurückgibt.
- Sagt die Person „nochmal“ oder „wiederholen“, rufe repeat_step auf und lies den zurückgegebenen Text vor.
- Sagt die Person „beenden“, „abbrechen“ oder „stopp“, rufe end_guidance auf und verabschiede dich in einem Satz.
- Fragen beantwortest du nur aus den Schritten und Hinweisen in steps_json. Fehlt die Information, sage ehrlich, dass du das nicht weißt und die Betreiberin gefragt werden sollte.
- Nachrichten, die mit „Ich habe manuell zu Schritt … gewechselt“ beginnen, kommen von der App: Lies nur den genannten Schritt vor.
```

**Dynamische Variablen** (werden beim Start gesetzt): `location`, `room`, `process_title`, `total_steps`, `step_index`, `step_title`, `step_instruction`, `step_caution`, `steps_json`. Unter *Security* die Nutzung dynamischer Variablen erlauben.

**Client-Tools** (Typ „Client“, Name muss exakt stimmen; alle ohne Parameter):

| Name | Beschreibung | Wait for response |
|---|---|---|
| `next_step` | Markiert den aktuellen Schritt als erledigt und liefert den nächsten Schritt als Text. | ja |
| `repeat_step` | Liefert den aktuellen Schritt erneut als Text. | ja |
| `end_guidance` | Beendet die Anleitung in der App. | ja |

**Synchronisation:** Tool-Aufrufe des Agents lösen dieselben Aktionen aus wie die Buttons; Buttons schicken dem Agent eine Nachricht mit dem neuen Schritt. Ein Wechsel von Prozess oder Ort beendet die Sitzung und startet eine neue mit den neuen Variablen.

## Hinweise für öffentliche Demos

`GET /api/voice/token` erzeugt bei jedem Aufruf ein Token. Vor einem öffentlichen Deployment ein Aufruf-Limit (z. B. pro Sitzungscookie und Tag) ergänzen.
```

- [ ] **Step 4: Verify**

`npx tsc --noEmit` → no errors. Browser (no env set): start guidance → „Sprachanleitung starten" → allow mic → banner „Demo-Modus · keine Sprachverbindung"; manual buttons keep working; tick „Browser-Sprachausgabe (simuliert)" → step is read aloud in German, next step is read on „Schritt erledigt", „Wiederholen" reads again. With `ELEVENLABS_API_KEY`/`ELEVENLABS_AGENT_ID` in `.env.local` and an agent configured per the doc (only if the user provides credentials): connection shows the wave, agent reads step 1, saying „weiter" advances the UI, pressing „Schritt erledigt" makes the agent read the next step, „beenden" returns to the map. If credentials are unavailable, record that in the final report as untested live.

- [ ] **Step 5: Commit**

```bash
git add app/components/spatial/VoiceSession.tsx app/components/spatial/SpatialView.tsx docs/elevenlabs-agent.md
git commit -m "Add ElevenLabs voice guidance with synced steps and demo mode

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Process editor fields, README, HTTP smoke test, build check, final verification

**Files:**
- Modify: `app/page.tsx` (process modal)
- Modify: `tests/spatial-smoke.mjs`
- Modify: `README.md`

- [ ] **Step 1: Add „Dauer" and per-step „Hinweis" to the process modal in `app/page.tsx`**

1. After `<label>Kurzbeschreibung<input value={processEdit.description||''} onChange={e=>setProcessEdit({...processEdit,description:e.target.value})}/></label>` insert:
   `<label>Dauer in Minuten (optional)<input type="number" min={0} max={600} value={processEdit.minutes??''} onChange={e=>setProcessEdit({...processEdit,minutes:e.target.value===''?undefined:Number(e.target.value)})}/></label>`
2. After `<label>Anleitung<textarea required rows={3} value={st.body} onChange={e=>setProcessEdit({...processEdit,steps:processEdit.steps!.map((x,j)=>j===i?{...x,body:e.target.value}:x)})}/></label>` insert:
   `<label>Hinweis (optional)<input value={st.caution||''} maxLength={300} onChange={e=>setProcessEdit({...processEdit,steps:processEdit.steps!.map((x,j)=>j===i?{...x,caution:e.target.value}:x)})}/></label>`

Verify: Prozesse → „Waschbecken reinigen" → Bearbeiten → fields show minutes 3 and the caution on step 1; save → version 2; Karte → the process still shows the caution.

- [ ] **Step 2: Extend `tests/spatial-smoke.mjs`** — replace the final `console.log` line with:

```js
let d=await call('/api/state');assert.equal(d.state.pins.length,6);assert.equal(d.state.floorPlans.length,1);assert.equal(d.state.rooms.length,6);
await call('/api/state',{type:'role',role:'cleaner'});await call('/api/state',{type:'pin-save',floorPlanId:'fp-alpenblick',name:'Test',x:.5,y:.5,processIds:['sp-bett']},400);
await call('/api/state',{type:'role',role:'owner'});await call('/api/state',{type:'pin-save',floorPlanId:'fp-alpenblick',name:'Materialschrank',x:.8,y:.5,processIds:['sp-verbrauch']});
d=await call('/api/state');const pin=d.state.pins.find(p=>p.name==='Materialschrank');assert.ok(pin);assert.equal(d.state.rooms.find(r=>r.id===pin.roomId).name,'Flur');assert.equal(pin.number,7);
await call('/api/state',{type:'role',role:'cleaner'});d=await call('/api/state');assert.ok(d.state.pins.some(p=>p.id===pin.id),'neuer Pin für Mitarbeitende sichtbar');
await call('/api/state',{type:'guidance-start',pinId:pin.id,processId:'sp-verbrauch'});d=await call('/api/state');const g=d.state.guidance[0];assert.equal(g.pinId,pin.id);assert.equal(g.step,0);
await call('/api/state',{type:'guidance-step',id:g.id,op:'next'});await call('/api/state',{type:'guidance-step',id:g.id,op:'next'});d=await call('/api/state');assert.equal(d.state.guidance[0].status,'done');
await call('/api/state',{type:'guidance-feedback',sessionId:g.id,comment:'Lief gut.'});d=await call('/api/state');assert.equal(d.state.feedback[0].pinId,pin.id);assert.equal(d.state.feedback[0].processId,'sp-verbrauch');
assert.equal('keyCipher' in d.state.settings,false);
console.log('PASS: Voice-Token-Route, Pins, Rollenfilter, Anleitung, Feedback.');
```

Run: `node tests/spatial-smoke.mjs` (dev server running) — Expected: PASS line. Also run `node tests/api-smoke.mjs` — Expected: still PASS.

- [ ] **Step 3: README updates**

In `README.md`:
1. Under „Was bereits funktioniert" add: `- Karte („Hauswissen vor Ort“): Grundriss mit Pins, ortsbezogene Prozesse, Schritt-für-Schritt-Anleitung mit optionaler ElevenLabs-Sprachbegleitung, Feedback an die Betreiberin. Ohne ElevenLabs-Zugangsdaten läuft ein gekennzeichneter Demo-Modus.`
2. Add a section after „Mistral verbinden":

```markdown
## ElevenLabs verbinden (Sprachanleitung in der Karte)

`ELEVENLABS_API_KEY` und `ELEVENLABS_AGENT_ID` in `.env.local` setzen (siehe `.env.example`). Die Agent-Konfiguration steht in `docs/elevenlabs-agent.md`. Beide Werte bleiben serverseitig; der Browser erhält nur ein kurzlebiges Sitzungs-Token. Ohne die Werte zeigt die Anleitung „Demo-Modus“ mit manuellen Bedienelementen und optionaler Browser-Sprachausgabe.

Die Karte nutzt denselben Demo-Arbeitsbereich wie der Rest der App: lokal pro Browser (`.data/`). Sollen Betreiberin und Team auf verschiedenen Geräten dieselben Pins sehen, ist das Supabase-Hosting (unten) nötig.
```
3. Under „Prüfungen" add `node tests/spatial-smoke.mjs` after the other two smoke commands.
4. In „Bewusste Grenzen" add: `- Karte: ein Beispiel-Grundriss (Alpenblick), Möbel schematisch; keine Grundriss-Zeichenwerkzeuge, keine Indoor-Ortung, keine Routen. Die Live-Sprachverbindung ist ohne hinterlegte ElevenLabs-Zugangsdaten nicht verifiziert.`

- [ ] **Step 4: Full verification**

Run, in order, and record results for the final report:
1. `npm test` → all PASS.
2. `node tests/api-smoke.mjs && node tests/spatial-smoke.mjs` → PASS.
3. `BUILD_CHECK=1 npm run build` → succeeds (type check included).
4. Browser (desktop 1280 px and phone 390 px), following the acceptance list in the spec: different pins → correct processes; Waschbecken vs Toilette differ; pins keep positions on resize; create/edit pin → visible for Mira after role switch and after reload; save validation messages; guidance starts with the selected pin/process; feedback recorded under the right pin (Lena sees it); demo-mode banner when no credentials; no secrets in `/api/state` or `/api/voice/token` responses (check the Network tab).

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx tests/spatial-smoke.mjs README.md
git commit -m "Finish spatial feature: process editor fields, smoke test, docs

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Self-review notes

- Spec §1–§8 map to Tasks 1 (data, storage upgrade), 2 (geometry), 3 (actions, visibility), 4 (token route, env), 5 (map, staff panel, styling, nav), 6 (guidance, feedback), 7 (owner editor), 8 (voice, agent doc), 9 (process fields, README, tests, verification).
- Names are consistent across tasks: `spatialMutate`, `spatialVisible`, `ensureSpatial`, `spatialSeed`, `roomAt`, `toNormalized`, `validPoint`, `pad`, `PinDraft`, action types `pin-save`, `guidance-start`, `guidance-step`, `guidance-feedback`, tool names `next_step`, `repeat_step`, `end_guidance`.
- Deviation from spec worth knowing: `repeat` is accepted by the reducer as a no-op but the client never sends it (repeat is handled locally/voice-only).
