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
