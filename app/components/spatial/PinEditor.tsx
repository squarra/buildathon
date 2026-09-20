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
