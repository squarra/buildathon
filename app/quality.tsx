'use client';
import {useRef,useState,ReactNode} from 'react';
import {Camera,CheckCircle2,AlertCircle,HelpCircle,ImageOff,Plus,X,Sparkles,ArrowRight,RefreshCw,MessageSquare,ScanLine,Workflow,Home,Check} from 'lucide-react';
import type {Standard,Inspection,Process,Role,Contribution} from '@/lib/types';
import {units} from '@/lib/types';
import {Badge,Modal,format,roleLabel,shrink} from './ui';
export const photoUrl=(id:string)=>`/api/upload?id=${id}`;
const statusTone:Record<Inspection['status'],string>={pass:'green',issues:'amber',unclear:'neutral'};
const statusText=(st:Inspection['status'],lang:string)=>st==='pass'?(lang==='en'?'Everything checks out':'Alles erledigt'):st==='issues'?(lang==='en'?'Please take another look':'Bitte noch einmal nachsehen'):(lang==='en'?'Photo not clear enough':'Foto zeigt zu wenig');

// Foto aufnehmen und gegen den hinterlegten Sicht-Standard prüfen lassen.
export function PhotoCheck({standard,unit,runId,stepId,busy,setBusy,setError,onResult,lang='de',label}:{standard:Standard;unit:string;runId?:string;stepId?:string;busy:boolean;setBusy:(b:boolean)=>void;setError:(e:string)=>void;onResult:(i:Inspection)=>void;lang?:string;label?:string}){
const input=useRef<HTMLInputElement>(null);
async function send(file:File){setBusy(true);setError('');try{const f=new FormData();f.set('file',await shrink(file));f.set('mode','inspect');f.set('standardId',standard.id);f.set('unit',unit);if(runId)f.set('runId',runId);if(stepId)f.set('stepId',stepId);const r=await fetch('/api/check',{method:'POST',body:f});const d=await r.json();if(!r.ok)throw Error(d.error);onResult(d.inspection);}catch(e:any){setError(e.message);}finally{setBusy(false);if(input.current)input.current.value='';}}
return <><input ref={input} type="file" hidden accept="image/*" capture="environment" onChange={e=>{if(e.target.files?.[0])send(e.target.files[0]);}}/>
<button type="button" className="button primary full" disabled={busy} onClick={()=>input.current?.click()}><Camera size={19}/>{label||(lang==='en'?'Photograph the room':'Foto vom Raum machen')}</button></>;
}

export function InspectionResult({inspection,standard,onReport,children,lang='de'}:{inspection:Inspection;standard?:Standard;onReport?:(f:{label:string;note:string})=>void;children?:ReactNode;lang?:string}){
const open=inspection.findings.filter(f=>!f.ok);
return <div className={`inspection-result ${inspection.status}`}>
<div className="inspection-head">
<span className="inspection-icon">{inspection.status==='pass'?<CheckCircle2 size={24}/>:inspection.status==='issues'?<AlertCircle size={24}/>:<HelpCircle size={24}/>}</span>
<div><strong>{statusText(inspection.status,lang)}</strong><span>{inspection.title} · {inspection.unit} · {format(inspection.created)}</span></div>
<Badge tone={statusTone[inspection.status]}>{open.length?`${open.length} ${lang==='en'?'to check':'Hinweise'}`:lang==='en'?'Complete':'Vollständig'}</Badge>
</div>
{inspection.demo&&<span className="simulation-label">OHNE KI · MANUELL PRÜFEN</span>}
{inspection.summary&&<p className="inspection-summary">{inspection.summary}</p>}
<div className="inspection-photos"><figure><img src={photoUrl(inspection.photo.id)} alt={lang==='en'?'Your photo':'Dein Foto'}/><figcaption>{lang==='en'?'Your photo':'Dein Foto'}</figcaption></figure>
{standard?.reference&&<figure><img src={photoUrl(standard.reference.id)} alt={lang==='en'?'Reference':'Idealbild'}/><figcaption>{lang==='en'?'Reference photo':'Idealbild'}</figcaption></figure>}</div>
<ol className="finding-list">{inspection.findings.map((f,i)=><li key={i} className={f.ok?'ok':f.severity==='wichtig'?'important':''}>
<span className="finding-mark">{f.ok?<Check size={15}/>:i+1}</span>
<div><strong>{f.label}</strong>{f.note&&<p>{f.note}</p>}
{!f.ok&&onReport&&<button type="button" className="text-button" onClick={()=>onReport({label:f.label,note:f.note})}><MessageSquare size={14}/>{lang==='en'?'This is wrong in the checklist':'Stimmt so nicht – melden'}</button>}</div></li>)}</ol>
<p className="inspection-note">{lang==='en'?'AI hints on visible details. The final call stays with you.':'KI-Hinweise zu sichtbaren Details. Die Entscheidung bleibt bei dir.'}</p>
{children}
</div>;
}

export function StandardCard({standard,onEdit,onCheck,children}:{standard:Standard;onEdit?:()=>void;onCheck?:()=>void;children?:ReactNode}){
return <article className="standard-card">
<div className="standard-image">{standard.reference?<img src={photoUrl(standard.reference.id)} alt={`Idealbild ${standard.title}`}/>:<div className="standard-placeholder"><ImageOff size={26}/><span>Noch kein Idealbild</span></div>}<span className="standard-room">{standard.room}</span></div>
<div className="standard-body">
<div className="row between"><h3>{standard.title}</h3><Badge tone="neutral">v{standard.version}</Badge></div>
<p><Home size={14}/> {standard.unit} · {standard.checklist.length} Prüfpunkte · aktualisiert {format(standard.updated)}</p>
<ul className="standard-points">{standard.checklist.slice(0,3).map((c,i)=><li key={i}>{c}</li>)}{standard.checklist.length>3&&<li className="more">+{standard.checklist.length-3} weitere</li>}</ul>
<div className="row">{onCheck&&<button className="button secondary" onClick={onCheck}><Camera size={16}/>Check machen</button>}{onEdit&&<button className="button ghost" onClick={onEdit}>Bearbeiten</button>}{children}</div>
</div></article>;
}

export function StandardEditor({draft,setDraft,processes,busy,setBusy,setError,onSubmit,onClose,notice,setNotice}:{draft:Partial<Standard>;setDraft:(s:Partial<Standard>)=>void;processes:Process[];busy:boolean;setBusy:(b:boolean)=>void;setError:(e:string)=>void;onSubmit:()=>void;onClose:()=>void;notice:string;setNotice:(s:string)=>void}){
const input=useRef<HTMLInputElement>(null);
const list=draft.checklist||[''];
const set=(i:number,v:string)=>setDraft({...draft,checklist:list.map((x,j)=>j===i?v:x)});
const process=processes.find(p=>p.id===draft.processId);
async function reference(file:File){setBusy(true);setError('');setNotice('');try{const f=new FormData();f.set('file',await shrink(file,1600));f.set('mode','suggest');f.set('room',draft.room||'');const r=await fetch('/api/check',{method:'POST',body:f});const d=await r.json();if(!r.ok)throw Error(d.error);const merged=d.checklist.length?[...list.filter(Boolean),...d.checklist.filter((c:string)=>!list.includes(c))].slice(0,20):list;setDraft({...draft,reference:d.attachment,checklist:merged.length?merged:['']});setNotice(d.warning||(d.checklist.length?`${d.checklist.length} Prüfpunkte aus dem Idealbild vorgeschlagen. Bitte durchsehen und anpassen.`:'Idealbild gespeichert.'));}catch(e:any){setError(e.message);}finally{setBusy(false);}}
return <Modal title={draft.id?'Sicht-Standard bearbeiten':'Sicht-Standard anlegen'} onClose={onClose} wide>
<p className="muted">Lade ein Foto des perfekt vorbereiteten Raums hoch. Die Punkte darunter sind das, worauf die KI im Foto der Mitarbeiterin achtet.</p>
<form onSubmit={e=>{e.preventDefault();onSubmit();}}>
<input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e=>{if(e.target.files?.[0])reference(e.target.files[0]);}}/>
<div className="reference-picker">
<div className="standard-image big">{draft.reference?<img src={photoUrl(draft.reference.id)} alt="Idealbild"/>:<div className="standard-placeholder"><ImageOff size={30}/><span>Noch kein Idealbild</span></div>}</div>
<div><button type="button" className="button secondary" disabled={busy} onClick={()=>input.current?.click()}><Camera size={17}/>{draft.reference?'Idealbild ersetzen':'Idealbild hochladen'}</button>
<p className="muted small-text">JPG, PNG oder WebP. Mit Mistral-Verbindung werden daraus Prüfpunkte vorgeschlagen.</p>
{notice&&<div className="info-box"><Sparkles size={18}/><p>{notice}</p></div>}</div>
</div>
<div className="form-grid"><label>Was wird geprüft?<input required value={draft.title||''} maxLength={160} placeholder="z. B. Schlafzimmer bezugsfertig" onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
<label>Raum<input required value={draft.room||''} maxLength={80} placeholder="z. B. Bad" onChange={e=>setDraft({...draft,room:e.target.value})}/></label></div>
<div className="form-grid"><label>Gilt für<select value={draft.unit||'Alle Wohnungen'} onChange={e=>setDraft({...draft,unit:e.target.value})}>{units.map(u=><option key={u}>{u}</option>)}</select></label>
<label>Im Prozessschritt anbieten<select value={draft.stepId?`${draft.processId}|${draft.stepId}`:''} onChange={e=>{const [processId,stepId]=e.target.value.split('|');setDraft({...draft,processId:processId||'',stepId:stepId||''});}}><option value="">Nicht mit einem Schritt verknüpfen</option>{processes.flatMap(p=>p.steps.map(st=><option key={`${p.id}|${st.id}`} value={`${p.id}|${st.id}`}>{p.title} · {st.title}</option>))}</select></label></div>
{process&&<p className="muted small-text"><Workflow size={14}/> Die Fachkraft bekommt den Foto-Check direkt in diesem Schritt angeboten.</p>}
<span className="field-label">Prüfpunkte · was muss im Foto zu sehen sein?</span>
<div className="checklist-editor">{list.map((c,i)=><div className="checklist-row" key={i}><span>{i+1}</span><input required value={c} maxLength={300} placeholder="z. B. Ersatzrolle Toilettenpapier sichtbar bereitgestellt" onChange={e=>set(i,e.target.value)}/><button type="button" className="icon-button" aria-label="Punkt entfernen" disabled={list.length===1} onClick={()=>setDraft({...draft,checklist:list.filter((_,j)=>j!==i)})}><X size={17}/></button></div>)}</div>
<button type="button" className="button secondary" disabled={list.length>=20} onClick={()=>setDraft({...draft,checklist:[...list,'']})}><Plus size={16}/>Prüfpunkt hinzufügen</button>
<div className="modal-actions"><button type="button" className="button ghost" onClick={onClose}>Abbrechen</button><button className="button primary" disabled={busy}><Check size={17}/>Standard veröffentlichen</button></div>
</form></Modal>;
}

export function QualityView({standards,inspections,processes,role,unit,setUnit,busy,setBusy,setError,onNew,onEdit,onConfirm,onReport,refresh}:{standards:Standard[];inspections:Inspection[];processes:Process[];role:Role;unit:string;setUnit:(u:string)=>void;busy:boolean;setBusy:(b:boolean)=>void;setError:(e:string)=>void;onNew:()=>void;onEdit:(s:Standard)=>void;onConfirm:(s:Standard)=>void;onReport:(c:Partial<Contribution>)=>void;refresh:(i:Inspection)=>void}){
const [active,setActive]=useState<Inspection>();
const [checking,setChecking]=useState<Standard>();
const shown=active||inspections[0];
return <>
<div className="page-heading"><div><span className="eyebrow">EIN FOTO. EIN ZWEITER BLICK.</span><h1>Zimmer-Check</h1><p>Ein Idealbild pro Raum. Die KI vergleicht das Foto vom fertigen Zimmer damit.</p></div>
{role==='owner'&&<button className="button primary" onClick={onNew}><Plus size={18}/>Sicht-Standard anlegen</button>}</div>
<div className="unit-bar"><Home size={20}/><span>Wohnung</span><select aria-label="Wohnung" value={unit} onChange={e=>setUnit(e.target.value)}>{units.slice(1).map(u=><option key={u}>{u}</option>)}</select></div>
<div className="standard-grid">{standards.filter(st=>st.unit==='Alle Wohnungen'||st.unit===unit).map(st=><StandardCard key={st.id} standard={st} onEdit={role==='owner'?()=>onEdit(st):undefined} onCheck={()=>setChecking(st)}>{role==='owner'&&<button className="text-button" disabled={busy} onClick={()=>onConfirm(st)}><RefreshCw size={15}/>Bild stimmt noch</button>}</StandardCard>)}</div>
{!standards.length&&<div className="empty"><ScanLine/>Noch kein Sicht-Standard. Lege einen Raum mit Idealbild an.</div>}
<section className="panel spaced"><div className="section-head"><h2>Letzte Zimmer-Checks</h2><span className="muted">Fotos bleiben im Betrieb gespeichert.</span></div>
{inspections.map(i=><button className="inspection-row" key={i.id} onClick={()=>setActive(i)}><img src={photoUrl(i.photo.id)} alt=""/><div className="grow"><strong>{i.title}</strong><p>{i.unit} · {roleLabel(i.role)} · {format(i.created)}</p></div><Badge tone={statusTone[i.status]}>{i.status==='pass'?'Vollständig':i.status==='issues'?`${i.findings.filter(f=>!f.ok).length} Hinweise`:'Unklar'}</Badge></button>)}
{!inspections.length&&<div className="empty"><Camera/>Noch keine Fotos geprüft.</div>}</section>
{shown&&active&&<Modal title="Ergebnis des Zimmer-Checks" onClose={()=>setActive(undefined)} wide><InspectionResult inspection={active} standard={standards.find(st=>st.id===active.standardId)} onReport={f=>{onReport({title:`Prüfpunkt anpassen: ${f.label}`,body:`Beim Zimmer-Check gemeldet.\n\nPrüfpunkt: ${f.label}\nHinweis der KI: ${f.note}\n\nMein Vorschlag: `,unit:active.unit,inspectionId:active.id});setActive(undefined);}}/></Modal>}
{checking&&<Modal title={checking.title} onClose={()=>setChecking(undefined)} wide>
<p className="muted">Fotografiere den fertigen Raum so, dass möglichst viele Prüfpunkte im Bild sind.</p>
{checking.reference?<div className="standard-image big"><img src={photoUrl(checking.reference.id)} alt="Idealbild"/></div>:<div className="info-box"><AlertCircle size={19}/><p>Für diesen Raum ist noch kein Idealbild hinterlegt. Die Prüfung nutzt nur die Punkte der Checkliste.</p></div>}
<ul className="standard-points spaced">{checking.checklist.map((c,i)=><li key={i}>{c}</li>)}</ul>
<PhotoCheck standard={checking} unit={checking.unit==='Alle Wohnungen'?unit:checking.unit} busy={busy} setBusy={setBusy} setError={setError} onResult={i=>{setChecking(undefined);setActive(i);refresh(i);}}/>
</Modal>}
</>;
}
