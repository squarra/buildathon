import {ElevenLabsClient,ElevenLabsError} from '@elevenlabs/elevenlabs-js';
import {guard,identity,transaction} from '@/lib/store';
// Der Schlüssel bleibt auf dem Server. Der Browser bekommt nur ein kurzlebiges Sitzungstoken.
export async function GET(req:Request){try{
guard(req);const {id}=await identity();
const key=process.env.ELEVENLABS_API_KEY?.trim();const agentId=process.env.ELEVENLABS_AGENT_ID?.trim();
if(!key||!agentId)return Response.json({error:'Der Wissnsepp ist noch nicht verbunden. Bitte ELEVENLABS_API_KEY und ELEVENLABS_AGENT_ID hinterlegen.',configured:false},{status:503});
// Gesprächsminuten kosten Geld: dieselbe Tagesgrenze wie für die übrigen KI-Aufrufe.
const limit=Number(process.env.VOICE_DAILY_LIMIT||20);
await transaction(id,s=>{const day=new Date().toISOString().slice(0,10);if(s.settings.day!==day){s.settings.day=day;s.settings.calls=0;}if(s.settings.calls>=limit)throw Error(`Das Demo-Limit von ${limit} Sprachgesprächen pro Tag ist erreicht.`);s.settings.calls++;});
try{const res=await new ElevenLabsClient({apiKey:key}).conversationalAi.conversations.getWebrtcToken({agentId});return Response.json({token:res.token});}
catch(e:any){
// Ein gescheiterter Versuch darf das Tageskontingent nicht aufbrauchen.
await transaction(id,s=>{if(s.settings.calls>0)s.settings.calls--;});
const code=e instanceof ElevenLabsError?e.statusCode:undefined;
// Antworten des Anbieters nicht durchreichen: sie enthalten interne Kennungen und sind für Mitarbeitende unbrauchbar.
console.error('voice-token',code,e?.message);
throw Error(code===401||code===403?'Der hinterlegte ElevenLabs-Schlüssel wird abgelehnt. Bitte einen Schlüssel mit der Berechtigung "Conversational AI" verwenden.':code===404?'Der konfigurierte Agent wurde nicht gefunden. Bitte ELEVENLABS_AGENT_ID prüfen.':code===429?'ElevenLabs ist derzeit ausgelastet oder das Kontingent ist aufgebraucht.':'Der Wissnsepp ist gerade nicht erreichbar. Bitte noch einmal versuchen.');}
}catch(e:any){return Response.json({error:e.message||'Verbindung zum Wissnsepp fehlgeschlagen.'},{status:400});}}
