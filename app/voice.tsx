'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {ConversationProvider,useConversationControls,useConversationStatus,useConversationMode,useConversationClientTool} from '@elevenlabs/react';
import {Mic,PhoneOff,Loader2,AlertCircle,Volume2,Ear} from 'lucide-react';

// Der Agent spricht, die Wissensdatenbank antwortet: jedes Tool geht über die
// bestehenden Routen und damit durch dieselbe Rollen- und Wohnungsprüfung.
export type VoiceTools={
ask:(frage:string)=>Promise<string>;
startProcess:(prozess:string)=>Promise<string>;
nextStep:()=>Promise<string>;
repeatStep:()=>Promise<string>;
report:(titel:string,beschreibung:string)=>Promise<string>;
roomCheck:()=>Promise<string>;
};
export type VoiceLine={id:number;who:'user'|'agent';text:string;tentative?:boolean};

export function VoicePanel(props:{tools:VoiceTools;unit:string;role:string;lang:string;context:string}){
return <ConversationProvider><VoiceInner {...props}/></ConversationProvider>;
}

function VoiceInner({tools,unit,role,lang,context}:{tools:VoiceTools;unit:string;role:string;lang:string;context:string}){
const {startSession,endSession,getOutputByteFrequencyData,getInputVolume}=useConversationControls();
const {status,message}=useConversationStatus();
const {isSpeaking}=useConversationMode();
const [lines,setLines]=useState<VoiceLine[]>([]);
const [error,setError]=useState('');
const [starting,setStarting]=useState(false);
const [level,setLevel]=useState(0);
const counter=useRef(0);
const end=useRef<HTMLDivElement>(null);
const live=status==='connected';

const add=useCallback((who:'user'|'agent',text:string)=>{if(!text.trim())return;setLines(l=>[...l.slice(-40),{id:counter.current++,who,text}]);},[]);
// Tool-Namen müssen exakt den im ElevenLabs-Dashboard angelegten entsprechen.
useConversationClientTool('wissen_suchen',async(p:any)=>tools.ask(String(p?.frage||'')));
useConversationClientTool('prozess_starten',async(p:any)=>tools.startProcess(String(p?.prozess||'')));
useConversationClientTool('naechster_schritt',async()=>tools.nextStep());
useConversationClientTool('schritt_wiederholen',async()=>tools.repeatStep());
useConversationClientTool('problem_melden',async(p:any)=>tools.report(String(p?.titel||'Meldung'),String(p?.beschreibung||'')));
useConversationClientTool('zimmer_check',async()=>tools.roomCheck());

useEffect(()=>{if(lines.length)end.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[lines]);
// Der Ring atmet mit der Stimme – so sieht man auf zwei Meter Abstand, wer gerade spricht.
useEffect(()=>{if(!live)return setLevel(0);let raf=0;const tick=()=>{try{if(isSpeaking){const d=getOutputByteFrequencyData();let sum=0;for(let i=0;i<d.length;i++)sum+=d[i];setLevel(Math.min(1,sum/d.length/90));}else setLevel(Math.min(1,getInputVolume()*2.4));}catch{}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[live,isSpeaking,getOutputByteFrequencyData,getInputVolume]);

async function start(){setError('');setStarting(true);try{
await navigator.mediaDevices.getUserMedia({audio:true});
const r=await fetch('/api/voice-token');const d=await r.json();
if(!r.ok)throw Error(d.error||'Verbindung fehlgeschlagen.');
setLines([]);
startSession({conversationToken:d.token,connectionType:'webrtc',
dynamicVariables:{wohnung:unit,rolle:role,sprache:lang==='en'?'English':'Deutsch',kontext:context},
onMessage:({message,source}:any)=>add(source==='user'?'user':'agent',String(message||'')),
onError:(e:any)=>setError(typeof e==='string'?e:e?.message||'Die Verbindung wurde unterbrochen.')});
}catch(e:any){setError(e?.name==='NotAllowedError'?'Für das Gespräch bitte den Zugriff auf das Mikrofon erlauben.':e.message);}finally{setStarting(false);}}

const state=starting||status==='connecting'?'connecting':status==='connected'?(isSpeaking?'speaking':'listening'):'idle';
const labels:Record<string,[string,string]>={idle:['Tippe auf das Mikrofon','Tap the microphone'],connecting:['Verbinde …','Connecting …'],listening:['Ich höre zu','I am listening'],speaking:['Der Wissnsepp spricht','Wissnsepp is speaking']};
const label=labels[state][lang==='en'?1:0];

return <section className="voice-panel">
<div className={`voice-stage ${state}`}>
<div className="voice-ring" style={{transform:`scale(${1+level*0.16})`}}/>
<div className="voice-ring outer" style={{transform:`scale(${1+level*0.3})`}}/>
<button className="voice-orb" onClick={()=>live?endSession():start()} disabled={starting} aria-label={live?'Gespräch beenden':'Gespräch starten'}>
{state==='connecting'?<Loader2 size={34} className="spin"/>:live?<PhoneOff size={32}/>:<Mic size={36}/>}
</button>
</div>
<div className="voice-status">{state==='speaking'?<Volume2 size={17}/>:state==='listening'?<Ear size={17}/>:null}<strong>{label}</strong></div>
<p className="voice-hint">{live?(lang==='en'?'Just talk. Say “next step” to continue or ask anything about this apartment.':'Sprich einfach. Sag „weiter“ für den nächsten Schritt oder frag, was du wissen willst.'):(lang==='en'?`Answers come from the approved knowledge for ${unit}.`:`Antworten kommen aus dem bestätigten Wissen für ${unit}.`)}</p>
{(error||message)&&<div className="voice-error"><AlertCircle size={17}/>{error||message}</div>}
{lines.length>0&&<div className="voice-transcript">{lines.map(l=><div key={l.id} className={`voice-line ${l.who}`}>{l.text}</div>)}<div ref={end}/></div>}
</section>;
}
