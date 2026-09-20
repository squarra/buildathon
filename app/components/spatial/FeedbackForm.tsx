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
