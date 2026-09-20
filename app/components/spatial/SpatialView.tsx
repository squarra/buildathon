'use client';
import {useMemo,useState} from 'react';
import {MapPin,Plus} from 'lucide-react';
import type {ClientState,Role,Process} from '@/lib/types';
import type {Pin,Point,PinDraft} from '@/lib/spatial/types';
import {roomAt} from '@/lib/spatial/geometry';
import FloorPlanMap from './FloorPlanMap';
import ProcessPanel from './ProcessPanel';
import PinEditor from './PinEditor';
import GuidancePanel from './GuidancePanel';import FeedbackForm from './FeedbackForm';import VoiceSession from './VoiceSession';
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
if(mode.kind==='edit'&&draft)panel=<PinEditor draft={draft} room={draftRoom} processes={state.processes} placing={placing} busy={busy} status={status} onChange={setDraft} onTogglePlacing={()=>{setPlacing(!placing);setStatus({text:placing?(draftRoom?`Position übernommen: ${draftRoom.name}`:''):'Tippe auf die Karte oder ziehe den Pin.'});}} onSave={saveDraft} onCancel={cancelEditor}/>;
if(mode.kind==='guide'&&session&&sessionPin)panel=<GuidancePanel session={session} pin={sessionPin} room={roomOf(sessionPin)} busy={busy} onNext={()=>stepOp('next')} onRepeat={()=>setRepeatKey(k=>k+1)} onExit={()=>stepOp('exit')} voice={<VoiceSession key={session.id} session={session} pin={sessionPin} room={roomOf(sessionPin)} repeatKey={repeatKey} onNext={()=>stepOp('next')} onExit={()=>stepOp('exit')}/>}/>;
else if(mode.kind==='feedback'&&session&&sessionPin)panel=<FeedbackForm session={session} pin={sessionPin} busy={busy} onSubmit={sendFeedback} onSkip={()=>setMode({kind:'map'})}/>;
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
