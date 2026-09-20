import {identity,transaction,guard,saveFile,loadFile} from '@/lib/store';import {reserve,mistral} from '@/lib/ai';import {allowed,recordInspection} from '@/lib/domain';import type {Finding} from '@/lib/types';
export const maxDuration=60;
const imageTypes=['image/jpeg','image/png','image/webp'];
const vision=()=>process.env.MISTRAL_VISION_MODEL||'pixtral-12b-2409';
function url(type:string,bytes:Buffer){return `data:${imageTypes.includes(type)?type:'image/jpeg'};base64,${bytes.toString('base64')}`;}
function clean(v:unknown,max:number){return typeof v==='string'?v.replace(/\s+/g,' ').trim().slice(0,max):'';}
export async function POST(req:Request){try{
guard(req);const {id,role}=await identity();const form=await req.formData();const mode=form.get('mode');const file=form.get('file');
if(!(file instanceof File))throw Error('Bitte ein Foto aufnehmen oder auswählen.');
if(file.size>8*1024*1024)throw Error('Das Foto ist zu groß. Bitte mit geringerer Auflösung aufnehmen.');
if(!imageTypes.includes(file.type))throw Error('Für den Zimmer-Check bitte ein Foto als JPG, PNG oder WebP verwenden.');
const bytes=Buffer.from(await file.arrayBuffer());

if(mode==='suggest'){
if(role!=='owner')throw Error('Nur die Betreiberin legt Sicht-Standards fest.');
const key=await transaction(id,reserve);const fileId=await saveFile(id,file);
const attachment={id:fileId,name:file.name,type:file.type};
if(!key)return Response.json({attachment,checklist:[],demo:true,warning:'Idealbild gespeichert. Für automatische Vorschläge bitte Mistral verbinden – die Prüfpunkte können auch selbst eingetragen werden.'});
const room=clean(form.get('room'),80)||'Raum';
const result=await mistral(key,[
{role:'system',content:'Du hilfst kleinen Ferienwohnungsbetrieben, einen visuellen Soll-Zustand zu beschreiben. Benenne ausschließlich, was auf dem Bild sichtbar ist. Keine Vermutungen über Sauberkeit, Personen oder Vorgänge außerhalb des Bildes. Gib JSON zurück: {checklist:string[]}. Jeder Punkt ist eine kurze, prüfbare Beobachtung auf Deutsch, zum Beispiel "Zwei Kissen aufgeschüttelt am Kopfende". Höchstens 8 Punkte.'},
{role:'user',content:[{type:'text',text:`Raum: ${room}. Erstelle aus diesem Idealbild prüfbare Punkte für den Zimmer-Check.`},{type:'image_url',image_url:url(file.type,bytes)}]}],vision());
const checklist=(Array.isArray(result.checklist)?result.checklist:[]).map((c:unknown)=>clean(c,300)).filter(Boolean).slice(0,8);
return Response.json({attachment,checklist,demo:false});}

const standardId=clean(form.get('standardId'),64),unit=clean(form.get('unit'),80);
const runId=clean(form.get('runId'),64)||undefined,stepId=clean(form.get('stepId'),120)||undefined;
const context=await transaction(id,async s=>{const st=s.standards.find(x=>x.id===standardId&&allowed(x,role,unit));if(!st)throw Error('Sicht-Standard nicht verfügbar.');return {key:await reserve(s),standard:{id:st.id,title:st.title,room:st.room,unit:st.unit,checklist:st.checklist,version:st.version,reference:st.reference}};});
const standard=context.standard;

let status:'pass'|'issues'|'unclear'='unclear',summary='',findings:Finding[]=[],demo=false;
if(!context.key){demo=true;status='unclear';summary='Keine KI-Verbindung: Bitte die Punkte selbst am Foto abgleichen und abhaken.';findings=standard.checklist.map(label=>({label,ok:false,note:'Manuell prüfen – keine automatische Bildanalyse aktiv.',severity:'hinweis' as const}));}
else{
const content:any[]=[{type:'text',text:`Wohnung: ${unit}. Raum: ${standard.room}. Standard: ${standard.title}.\nPrüfpunkte:\n${standard.checklist.map((c,i)=>`${i+1}. ${c}`).join('\n')}`}];
if(standard.reference){try{content.push({type:'text',text:'Bild 1 ist das hinterlegte Idealbild (Soll-Zustand).'});content.push({type:'image_url',image_url:url(standard.reference.type,await loadFile(id,standard.reference.id))});}catch{}}
content.push({type:'text',text:`Bild ${standard.reference?2:1} ist das aktuelle Foto der Mitarbeiterin (Ist-Zustand). Prüfe jeden Punkt.`});
content.push({type:'image_url',image_url:url(file.type,bytes)});
const result=await mistral(context.key,[
{role:'system',content:'Du bist der Wissnsepp, die visuelle Qualitätshilfe von SeasonUp für kleine Ferienwohnungsbetriebe in Tirol. Vergleiche das aktuelle Foto mit dem Idealbild und den vorgegebenen Prüfpunkten. Beurteile ausschließlich sichtbare Details. Wenn ein Punkt auf dem Foto nicht erkennbar ist, setze ok=false und schreibe in note ausdrücklich, dass es auf dem Foto nicht zu sehen ist – behaupte niemals einen Mangel, den du nicht siehst. Erfinde keine Gegenstände, Räume oder Betriebsregeln. Beschreibe keine Personen. Sprich die Mitarbeiterin freundlich und direkt an, kurze Sätze, Deutsch. Gib JSON zurück: {status:"pass"|"issues"|"unclear",summary:string,findings:[{label:string,ok:boolean,note:string,severity:"hinweis"|"wichtig"}]}. label ist der jeweilige Prüfpunkt im Wortlaut. status ist "pass", wenn alle Punkte erfüllt sind, "issues" bei mindestens einem offenen Punkt, "unclear", wenn das Foto zu wenig zeigt. Die abschließende Freigabe trifft immer ein Mensch.'},
{role:'user',content}],vision());
summary=clean(result.summary,600);
findings=(Array.isArray(result.findings)?result.findings:[]).slice(0,20).map((f:any)=>({label:clean(f?.label,300),ok:f?.ok===true,note:clean(f?.note,400),severity:f?.severity==='wichtig'?'wichtig' as const:'hinweis' as const})).filter((f:Finding)=>f.label);
status=result.status==='pass'?'pass':result.status==='unclear'?'unclear':'issues';
if(!findings.length){status='unclear';summary=summary||'Das Foto zeigt zu wenig für einen Abgleich. Bitte den ganzen Raum aufnehmen.';}
else if(status==='pass'&&findings.some(f=>!f.ok))status='issues';}

const fileId=await saveFile(id,file);
const inspection=await transaction(id,s=>recordInspection(s,role,{standardId:standard.id,unit,photo:{id:fileId,name:file.name,type:file.type},status,summary,findings,demo,runId,stepId}));
return Response.json({inspection,demo});
}catch(e:any){return Response.json({error:e.message},{status:400});}}
