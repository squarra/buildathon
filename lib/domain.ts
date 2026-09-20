import {State,Role,Entry,Step,Standard,Finding,Inspection} from './types';
import {english} from './english';
import {seed} from './seed';
import {randomUUID} from 'node:crypto';
export const date=()=>new Date().toISOString().slice(0,10);
export function allowed(entry:{roles:Role[];unit?:string;archived?:boolean},role:Role,unit?:string){return !entry.archived&&entry.roles.includes(role)&&(!unit||entry.unit==='Alle Wohnungen'||entry.unit===unit);}
export function visible(s:State,role:Role){return {...s,entries:s.entries.filter(e=>allowed(e,role)),processes:s.processes.filter(p=>allowed(p,role)),contributions:s.contributions.filter(c=>role==='owner'||c.author===role),runs:s.runs.filter(r=>r.role===role),standards:s.standards.filter(st=>allowed(st,role)),inspections:s.inspections.filter(i=>role==='owner'||i.role===role),ledger:s.ledger.filter(l=>role==='owner'||l.role===role),rewards:s.rewards.filter(r=>role==='owner'||r.role===role),checks:role==='owner'?s.checks:[],handover:role==='owner'?s.handover:null,settings:{hasKey:!!s.settings.keyCipher,calls:s.settings.calls}};}
function str(v:unknown,max=16000){if(typeof v!=='string'||v.length>max)throw Error('Ungültige Eingabe.');return v.trim();}
function award(s:State,id:string,role:Role,points:number,reason:string){if(!s.ledger.some(x=>x.id===id))s.ledger.push({id,role,points,reason,date:date()});}
export function mutate(s:State,role:Role,a:Record<string,any>){
const owner=()=>{if(role!=='owner')throw Error('Nur die Betreiberin kann diese Aktion ausführen.');};
if(a.type==='contribute'){
const title=str(a.title,200),body=str(a.body);if(!title||!body)throw Error('Bitte Titel und Inhalt ergänzen.');
if(a.entryId&&!s.entries.some(e=>e.id===a.entryId&&allowed(e,role)))throw Error('Eintrag nicht zugänglich.');
if(a.processId&&!s.processes.some(p=>p.id===a.processId&&allowed(p,role)))throw Error('Prozess nicht zugänglich.');
if(a.inspectionId&&!s.inspections.some(i=>i.id===a.inspectionId&&(role==='owner'||i.role===role)))throw Error('Zimmer-Check nicht zugänglich.');
s.contributions.unshift({id:randomUUID(),title,body,entryId:a.entryId||undefined,processId:a.processId||undefined,stepId:a.stepId||undefined,processVersion:a.processVersion,inspectionId:a.inspectionId||undefined,unit:str(a.unit||'Alle Wohnungen',80),author:role,status:'open',created:date(),attachment:a.attachment});
}else if(a.type==='review'){
owner();const c=s.contributions.find(x=>x.id===a.id);if(!c||c.status!=='open')throw Error('Dieser Beitrag wurde bereits bearbeitet.');
if(a.approve){const body=str(a.body),title=str(a.title,200);if(!body||!title)throw Error('Bitte bestätigten Inhalt ergänzen.');
if(c.processId&&c.stepId){const p=s.processes.find(p=>p.id===c.processId);const st=p?.steps.find(st=>st.id===c.stepId);if(!p||!st)throw Error('Prozessschritt nicht mehr vorhanden.');if(c.processVersion&&c.processVersion!==p.version)throw Error('Der Prozess wurde inzwischen geändert. Bitte neuen Beitrag zur aktuellen Version anlegen.');p.history??=[];p.history.push({version:p.version,steps:structuredClone(p.steps),date:date()});st.body=body;st.title=title;st.entryIds=[];p.version++;}
else {let e=s.entries.find(e=>e.id===c.entryId);if(e){e.history.push({version:e.version,body:e.body,date:date()});e.body=body;e.title=title;if(c.attachment)e.attachments=[...(e.attachments||[]),c.attachment];e.version++;e.verified=date();e.season=s.season;e.due=new Date(Date.now()+30*86400000).toISOString().slice(0,10);}else{const entryId=randomUUID();c.entryId=entryId;s.entries.push({id:entryId,attachments:c.attachment?[c.attachment]:[],title,body,category:str(a.category||'Hauswissen',80),unit:c.unit,roles:a.private?['owner','staff']:['owner','staff','cleaner'],version:1,verified:date(),season:s.season,due:new Date(Date.now()+30*86400000).toISOString().slice(0,10),owner:'Lena',history:[]});}}
c.status='approved';c.resolution='Als bestätigtes Wissen übernommen';award(s,`contribution-${c.id}`,c.author,10,c.title);
}else{c.status='rejected';c.resolution=str(a.reason||'Nach Prüfung nicht übernommen',300);}
}else if(a.type==='verify'){
owner();const e=s.entries.find(e=>e.id===a.id);if(!e)throw Error('Eintrag fehlt.');const period=a.season?s.season:date().slice(0,7);const id=`${e.id}-${period}`;if(!s.checks.some(c=>c.id===id)){s.checks.push({id,entryId:e.id,period,date:date()});award(s,`check-${id}`,role,2,`Geprüft: ${e.title}`);}e.verified=date();e.season=s.season;e.due=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
}else if(a.type==='season'){owner();s.season=str(a.name,80);if(!s.season)throw Error('Bitte Saison benennen.');
}else if(a.type==='handover'){owner();s.handover={notes:str(a.notes),summary:str(a.summary),status:a.approve?'approved':'draft',date:date()};
}else if(a.type==='start'){
const p=s.processes.find(p=>p.id===a.id&&allowed(p,role));if(!p)throw Error('Prozess nicht verfügbar.');if(!['Alpenblick','Zirbennest','Talruhe'].includes(a.unit))throw Error('Bitte Wohnung auswählen.');
const steps=p.steps.map(st=>{let ids=st.entryIds;if(p.id==='p2'&&st.id==='p2-s2')ids=[a.unit==='Alpenblick'?'e2':a.unit==='Zirbennest'?'e3':'e4'];const es=ids.map(id=>s.entries.find(e=>e.id===id&&allowed(e,role,a.unit))).filter(Boolean) as Entry[];
if(ids.length&&!es.length)return null;const en=es.length&&es.every(e=>e.version===1&&english[e.id])?es.map(e=>english[e.id]):[];return {...st,titleEn:en.length===1?en[0].title:undefined,bodyEn:en.length?en.map(e=>e.body).join('\n\n'):undefined,title:p.id==='p2'&&st.id==='p2-s2'?es[0].title:st.title,body:es.length?es.map(e=>e.body).join('\n\n'):st.body,entryIds:es.map(e=>e.id)};}).filter(Boolean) as Step[];
s.runs.unshift({id:randomUUID(),processId:p.id,title:p.title,unit:a.unit,role,version:p.version,steps,done:[],created:date()});
}else if(a.type==='step'){
const r=s.runs.find(r=>r.id===a.id&&r.role===role);if(!r||!r.steps.some(st=>st.id===a.stepId))throw Error('Schritt nicht verfügbar.');r.done=a.done?[...new Set([...r.done,a.stepId])]:r.done.filter(id=>id!==a.stepId);r.completed=r.done.length===r.steps.length?date():undefined;
}else if(a.type==='process'){
owner();const title=str(a.title,160);const steps=Array.isArray(a.steps)?a.steps.map((st:any)=>({id:st.id?str(st.id,100):randomUUID(),title:str(st.title,160),body:str(st.body,5000),entryIds:[]})):[];if(!title||!steps.length||steps.some((st:Step)=>!st.body||!st.title))throw Error('Bitte Titel und vollständige Schritte ergänzen.');if(steps.length>30)throw Error('Maximal 30 Schritte.');const p=s.processes.find(p=>p.id===a.id);if(p){p.history??=[];p.history.push({version:p.version,steps:structuredClone(p.steps),date:date()});p.title=title;p.description=str(a.description||p.description,300);p.steps=steps;p.version++;}else{s.processes.push({id:randomUUID(),title,description:str(a.description||'Individueller Ablauf',300),category:'Eigener Prozess',roles:['owner','staff','cleaner'],steps,version:1});}
}else if(a.type==='standard'){
owner();const title=str(a.title,160);const room=str(a.room||'Raum',80);const unit=str(a.unit||'Alle Wohnungen',80);
const checklist=(Array.isArray(a.checklist)?a.checklist:[]).map((x:any)=>str(x,300)).filter(Boolean).slice(0,20);
if(!title||!checklist.length)throw Error('Bitte Titel und mindestens einen Prüfpunkt ergänzen.');
const st=s.standards.find(x=>x.id===a.id);
if(st){st.history.push({version:st.version,checklist:[...st.checklist],date:date()});st.title=title;st.room=room;st.unit=unit;st.checklist=checklist;if(a.reference)st.reference=a.reference;if(a.processId!==undefined){st.processId=a.processId||undefined;st.stepId=a.stepId||undefined;}st.version++;st.updated=date();}
else s.standards.push({id:randomUUID(),title,room,unit,roles:['owner','staff','cleaner'],checklist,reference:a.reference,processId:a.processId||undefined,stepId:a.stepId||undefined,version:1,updated:date(),owner:'Lena',history:[]});
}else if(a.type==='confirmStandard'){
owner();const st=s.standards.find(x=>x.id===a.id);if(!st)throw Error('Sicht-Standard fehlt.');const period=date().slice(0,7);const id=`standard-${st.id}-${period}`;if(!s.checks.some(c=>c.id===id)){s.checks.push({id,entryId:st.id,period,date:date()});award(s,`check-${id}`,role,2,`Sicht-Standard geprüft: ${st.title}`);}st.updated=date();
}else if(a.type==='archiveStandard'){owner();const st=s.standards.find(x=>x.id===a.id);if(!st)throw Error('Sicht-Standard fehlt.');st.archived=true;
}else if(a.type==='reward'){
const options:Record<string,{title:string;cost:number}>={coffee:{title:'Jause · Demo',cost:10},team:{title:'Marende mit dem Team · Demo',cost:30}};const r=options[a.reward];if(!r)throw Error('Belohnung fehlt.');const balance=s.ledger.filter(l=>l.role===role).reduce((n,l)=>n+l.points,0);if(balance<r.cost)throw Error('Dafür fehlen noch Punkte.');const id=randomUUID();s.rewards.push({id,role,title:r.title,cost:r.cost,status:'requested'});award(s,`reward-${id}`,role,-r.cost,`Angefragt: ${r.title}`);
}else if(a.type==='approveReward'){owner();const r=s.rewards.find(r=>r.id===a.id);if(r)r.status='approved';
}else throw Error('Unbekannte Aktion.');
return s;
}
export function recordInspection(s:State,role:Role,data:{standardId:string;unit:string;photo:{id:string;name:string;type:string};status:Inspection['status'];summary:string;findings:Finding[];demo?:boolean;runId?:string;stepId?:string}){
const st=s.standards.find(x=>x.id===data.standardId&&allowed(x,role,data.unit));if(!st)throw Error('Sicht-Standard nicht verfügbar.');
const inspection:Inspection={id:randomUUID(),standardId:st.id,title:st.title,unit:data.unit,role,photo:data.photo,status:data.status,summary:data.summary,findings:data.findings,demo:data.demo,runId:data.runId,stepId:data.stepId,created:date()};
s.inspections.unshift(inspection);if(s.inspections.length>40)s.inspections.length=40;
if(!data.demo&&data.status==='pass')award(s,`inspection-${inspection.id}`,role,2,`Zimmer-Check bestanden: ${st.title}`);
return inspection;}
export function standardFor(s:State,role:Role,unit:string,processId?:string,stepId?:string){return s.standards.find(st=>allowed(st,role,unit)&&st.processId===processId&&st.stepId===stepId);}
// Ältere Arbeitsbereiche wurden vor neueren Feldern angelegt. Ohne diese Angleichung
// läuft jedes spätere .filter() auf undefined und die ganze Oberfläche bricht ab.
export function migrate(data:any):State{const base=seed();if(!data||typeof data!=='object')return base;
for(const k of ['entries','processes','contributions','runs','standards','inspections','ledger','rewards','checks'] as const)if(!Array.isArray((data as any)[k]))(data as any)[k]=k==='standards'||k==='inspections'?base[k]:[];
if(!data.handover||typeof data.handover!=='object')data.handover=base.handover;
if(typeof data.season!=='string')data.season=base.season;
if(!data.settings||typeof data.settings!=='object')data.settings=base.settings;
if(typeof data.settings.calls!=='number')data.settings.calls=0;
if(typeof data.settings.day!=='string')data.settings.day=base.settings.day;
return data as State;}
