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
