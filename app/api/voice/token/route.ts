import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';
export const dynamic='force-dynamic';
export async function GET(){const apiKey=process.env.ELEVENLABS_API_KEY?.trim(),agentId=process.env.ELEVENLABS_AGENT_ID?.trim();if(!apiKey||!agentId)return Response.json({demo:true});
try{const client=new ElevenLabsClient({apiKey});const res=await client.conversationalAi.conversations.getWebrtcToken({agentId});return Response.json({token:res.token});}
catch{return Response.json({error:'Sprachverbindung nicht verfügbar. Bitte ElevenLabs-Konfiguration prüfen.'},{status:502});}}
