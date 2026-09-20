import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';let cookies={};
async function call(path,body,expect=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:base,Cookie:Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ')},...(body?{body:JSON.stringify(body)}:{})});for(const c of r.headers.getSetCookie()){const [k,v]=c.split(';')[0].split('=');cookies[k]=v;}const d=await r.json();assert.equal(r.status,expect,JSON.stringify(d));return d;}
const vt=await call('/api/voice/token');if(!process.env.ELEVENLABS_API_KEY){assert.equal(vt.demo,true);assert.equal('token' in vt,false);}else assert.ok(vt.token);
assert.equal(/sk_|agent_/.test(JSON.stringify(vt)),false,'keine Zugangsdaten im Client');
console.log('PASS: Voice-Token-Route.');
