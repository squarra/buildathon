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
