'use client';
import {useEffect,useRef,useState} from 'react';
import {ConversationProvider,useConversation} from '@elevenlabs/react';
import {Mic,AudioLines,Loader2} from 'lucide-react';
import type {GuidanceSession,Pin,Room} from '@/lib/spatial/types';
type Props={session:GuidanceSession;pin:Pin;room?:Room;repeatKey:number;onNext:()=>void;onExit:()=>void};
type Voice='idle'|'connecting'|'connected'|'demo'|'error';
const cur=(s:GuidanceSession)=>Math.min(s.step,s.steps.length-1);
function stepText(s:GuidanceSession,i:number){const st=s.steps[i];return `Schritt ${i+1} von ${s.steps.length}: ${st.title}. ${st.body}${st.caution?` Achtung: ${st.caution}`:''}`;}
const canSpeak=()=>typeof window!=='undefined'&&'speechSynthesis' in window;
function say(text:string){if(!canSpeak())return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';speechSynthesis.speak(u);}
function hush(){if(canSpeak())speechSynthesis.cancel();}
export default function VoiceSession(props:Props){return <ConversationProvider><VoiceInner {...props}/></ConversationProvider>;}
function VoiceInner({session,pin,room,repeatKey,onNext,onExit}:Props){
const [voice,setVoice]=useState<Voice>('idle');const [detail,setDetail]=useState('');const [speak,setSpeak]=useState(false);
const latest=useRef({session,onNext,onExit});latest.current={session,onNext,onExit};
const agentStep=useRef<number|null>(null);const lastStep=useRef(session.step);const firstRepeat=useRef(repeatKey);
const conversation=useConversation({onConnect:()=>setVoice('connected'),onDisconnect:()=>setVoice(v=>v==='connected'||v==='connecting'?'idle':v),onError:(message:string)=>{setVoice('error');setDetail(message||'Verbindung unterbrochen.');}});
const conv=useRef(conversation);conv.current=conversation;
useEffect(()=>()=>{hush();try{conv.current.endSession();}catch{}},[]);
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
try{conversation.startSession({conversationToken:token,connectionType:'webrtc',
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
