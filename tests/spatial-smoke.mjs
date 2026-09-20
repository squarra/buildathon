import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';let cookies={};
async function call(path,body,expect=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:base,Cookie:Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ')},...(body?{body:JSON.stringify(body)}:{})});for(const c of r.headers.getSetCookie()){const [k,v]=c.split(';')[0].split('=');cookies[k]=v;}const d=await r.json();assert.equal(r.status,expect,JSON.stringify(d));return d;}
const vt=await call('/api/voice/token');if(!process.env.ELEVENLABS_API_KEY){assert.equal(vt.demo,true);assert.equal('token' in vt,false);}else assert.ok(vt.token);
assert.equal(/sk_|agent_/.test(JSON.stringify(vt)),false,'keine Zugangsdaten im Client');
let d=await call('/api/state');assert.equal(d.state.pins.length,6);assert.equal(d.state.floorPlans.length,1);assert.equal(d.state.rooms.length,6);
await call('/api/state',{type:'role',role:'cleaner'});await call('/api/state',{type:'pin-save',floorPlanId:'fp-alpenblick',name:'Test',x:.5,y:.5,processIds:['sp-bett']},400);
await call('/api/state',{type:'role',role:'owner'});await call('/api/state',{type:'pin-save',floorPlanId:'fp-alpenblick',name:'Materialschrank',x:.8,y:.5,processIds:['sp-verbrauch']});
d=await call('/api/state');const pin=d.state.pins.find(p=>p.name==='Materialschrank');assert.ok(pin);assert.equal(d.state.rooms.find(r=>r.id===pin.roomId).name,'Flur');assert.equal(pin.number,7);
await call('/api/state',{type:'role',role:'cleaner'});d=await call('/api/state');assert.ok(d.state.pins.some(p=>p.id===pin.id),'neuer Pin für Mitarbeitende sichtbar');
await call('/api/state',{type:'guidance-start',pinId:pin.id,processId:'sp-verbrauch'});d=await call('/api/state');const g=d.state.guidance[0];assert.equal(g.pinId,pin.id);assert.equal(g.step,0);
await call('/api/state',{type:'guidance-step',id:g.id,op:'next'});await call('/api/state',{type:'guidance-step',id:g.id,op:'next'});d=await call('/api/state');assert.equal(d.state.guidance[0].status,'done');
await call('/api/state',{type:'guidance-feedback',sessionId:g.id,comment:'Lief gut.'});d=await call('/api/state');assert.equal(d.state.feedback[0].pinId,pin.id);assert.equal(d.state.feedback[0].processId,'sp-verbrauch');
assert.equal('keyCipher' in d.state.settings,false);
console.log('PASS: Voice-Token-Route, Pins, Rollenfilter, Anleitung, Feedback.');
