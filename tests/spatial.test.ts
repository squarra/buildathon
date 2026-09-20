import test from 'node:test';import assert from 'node:assert/strict';
import {seed} from '../lib/seed';
import {ensureSpatial} from '../lib/spatial/seed';

test('Seed enthält Grundriss, sechs Räume, sechs Pins und verortete Prozesse',()=>{const s=seed();assert.equal(s.floorPlans.length,1);assert.equal(s.rooms.length,6);assert.equal(s.pins.length,6);assert.ok(s.processes.filter(p=>p.category==='Vor Ort').length>=12);
for(const p of s.pins){assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1,`Pin ${p.id} normalisiert`);assert.ok(s.rooms.some(r=>r.id===p.roomId),`Pin ${p.id} hat Raum`);assert.ok(p.processIds.length>=1);for(const id of p.processIds)assert.ok(s.processes.some(x=>x.id===id),`Prozess ${id} existiert`);}
for(const r of s.rooms)for(const [x,y] of r.polygon)assert.ok(x>=0&&x<=1&&y>=0&&y<=1);
assert.deepEqual(s.guidance,[]);assert.deepEqual(s.feedback,[]);
const shared=s.pins.filter(p=>p.processIds.includes('sp-bett'));assert.equal(shared.length,2,'Bett-Prozess wird an zwei Pins wiederverwendet');
assert.ok(s.processes.find(p=>p.id==='sp-waschbecken')!.steps.some(st=>st.caution));assert.equal(typeof s.processes.find(p=>p.id==='sp-waschbecken')!.minutes,'number');});

test('ensureSpatial ergänzt fehlende Spatial-Daten in alten Arbeitsbereichen',()=>{const s:any=seed();delete s.floorPlans;delete s.rooms;delete s.pins;delete s.guidance;delete s.feedback;s.processes=s.processes.filter((p:any)=>p.category!=='Vor Ort');ensureSpatial(s);assert.equal(s.floorPlans.length,1);assert.equal(s.pins.length,6);assert.ok(s.processes.some((p:any)=>p.id==='sp-bett'));ensureSpatial(s);assert.equal(s.processes.filter((p:any)=>p.id==='sp-bett').length,1,'idempotent');});
import {clamp01,toNormalized,pointInPolygon,roomAt,validPoint} from '../lib/spatial/geometry';

test('Geometrie: Pointer → normalisierte Koordinaten, Raumtreffer, Ablehnung außerhalb',()=>{const s=seed();const rect={left:100,top:50,width:400,height:600};
assert.deepEqual(toNormalized(100,50,rect),{x:0,y:0});assert.deepEqual(toNormalized(500,650,rect),{x:1,y:1});assert.deepEqual(toNormalized(300,350,rect),{x:.5,y:.5});assert.deepEqual(toNormalized(0,0,rect),{x:0,y:0},'wird begrenzt');
assert.equal(clamp01(1.4),1);assert.equal(clamp01(-2),0);
const bath=s.rooms.find(r=>r.id==='r-bath')!;assert.ok(pointInPolygon({x:258/460,y:337/660},bath.polygon));assert.ok(!pointInPolygon({x:140/460,y:388/660},bath.polygon),'Kerbe links unten gehört nicht zum Bad');
for(const p of s.pins)assert.equal(roomAt(s.rooms,'fp-alpenblick',p)?.id,p.roomId,`Pin ${p.id} liegt im gespeicherten Raum`);
assert.equal(roomAt(s.rooms,'fp-alpenblick',{x:.02,y:.02}),undefined,'Ecke außerhalb');assert.equal(roomAt(s.rooms,'fp-alpenblick',{x:.5,y:.98}),undefined,'unter dem Wohnzimmer');assert.equal(roomAt(s.rooms,'anderer-plan',{x:.5,y:.5}),undefined);
assert.ok(validPoint({x:0,y:1}));assert.ok(!validPoint({x:1.1,y:0}));assert.ok(!validPoint({x:'0.5',y:0.5}));assert.ok(!validPoint(null));});
import {mutate,visible} from '../lib/domain';

test('Pin speichern: nur Betreiberin, Name und Prozess Pflicht, Position muss in einem Raum liegen',()=>{const s=seed();const base={type:'pin-save',floorPlanId:'fp-alpenblick',name:'Materialschrank',x:.8,y:.5,processIds:['sp-verbrauch']};
assert.throws(()=>mutate(s,'cleaner',base),/Betreiberin/);assert.throws(()=>mutate(s,'owner',{...base,name:'  '}),/Namen/);assert.throws(()=>mutate(s,'owner',{...base,processIds:[]}),/mindestens einen Prozess/);assert.throws(()=>mutate(s,'owner',{...base,processIds:['gibt-es-nicht']}),/mindestens einen Prozess/);assert.throws(()=>mutate(s,'owner',{...base,x:.02,y:.02}),/innerhalb eines Raums/);assert.throws(()=>mutate(s,'owner',{...base,x:1.5}),/Position/);assert.throws(()=>mutate(s,'owner',{...base,floorPlanId:'nope'}),/Grundriss/);
mutate(s,'owner',base);const pin=s.pins[s.pins.length-1];assert.equal(pin.number,7);assert.equal(pin.roomId,'r-hall');assert.equal(pin.name,'Materialschrank');
mutate(s,'owner',{...base,id:pin.id,name:'Putzschrank',x:.15,y:.45,processIds:['sp-verbrauch','sp-kaffee','sp-kaffee']});assert.equal(s.pins.length,7);assert.equal(pin.name,'Putzschrank');assert.equal(pin.roomId,'r-kitchen');assert.deepEqual(pin.processIds,['sp-verbrauch','sp-kaffee']);assert.equal(pin.number,7,'Nummer bleibt bei Bearbeitung');
assert.throws(()=>mutate(s,'owner',{...base,id:'fehlt'}),/Pin fehlt/);});

test('Zwei Pins im selben Raum zeigen unterschiedliche Prozesse; Sichtbarkeit nach Rolle',()=>{const s=seed();const sink=s.pins.find(p=>p.id==='pin-sink')!,toilet=s.pins.find(p=>p.id==='pin-toilet')!;assert.equal(sink.roomId,toilet.roomId);assert.notDeepEqual(sink.processIds,toilet.processIds);
mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-sink',processId:'sp-waschbecken'});mutate(s,'staff',{type:'guidance-start',pinId:'pin-toilet',processId:'sp-toilette'});
const c=visible(s,'cleaner') as any,o=visible(s,'owner') as any;assert.equal(c.pins.length,6);assert.equal(c.guidance.length,1);assert.equal(c.guidance[0].pinId,'pin-sink');assert.equal(o.guidance.length,2);assert.equal('keyCipher' in c.settings,false);});

test('Anleitung: startet mit Ort und Prozess, schreitet fort, endet, Feedback referenziert Ort und Prozess',()=>{const s=seed();
assert.throws(()=>mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-sink',processId:'sp-toilette'}),/nicht verfügbar/);
mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-sink',processId:'sp-waschbecken'});const g=s.guidance[0];assert.equal(g.pinId,'pin-sink');assert.equal(g.processId,'sp-waschbecken');assert.equal(g.steps.length,4);assert.equal(g.step,0);assert.equal(g.status,'active');assert.equal(g.processVersion,1);
assert.throws(()=>mutate(s,'cleaner',{type:'guidance-feedback',sessionId:g.id,comment:'zu früh'}),/Abschluss/);
mutate(s,'cleaner',{type:'guidance-step',id:g.id,op:'repeat'});assert.equal(g.step,0);
mutate(s,'cleaner',{type:'guidance-step',id:g.id,op:'next'});assert.equal(g.step,1);
assert.throws(()=>mutate(s,'staff',{type:'guidance-step',id:g.id,op:'next'}),/Keine aktive/);
mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-toilet',processId:'sp-toilette'});assert.equal(g.status,'done');assert.equal(g.exited,true,'Wechsel beendet die alte Sitzung ausdrücklich');const g2=s.guidance[0];assert.equal(g2.pinId,'pin-toilet');
for(let i=0;i<4;i++)mutate(s,'cleaner',{type:'guidance-step',id:g2.id,op:'next'});assert.equal(g2.status,'done');assert.ok(g2.finished);assert.equal(g2.exited,undefined);
assert.throws(()=>mutate(s,'cleaner',{type:'guidance-feedback',sessionId:g2.id,comment:''}),/Feedback/);
mutate(s,'cleaner',{type:'guidance-feedback',sessionId:g2.id,comment:'Der Hinweis zum roten Tuch war hilfreich.'});const f=s.feedback[0];assert.equal(f.pinId,'pin-toilet');assert.equal(f.processId,'sp-toilette');assert.equal(f.sessionId,g2.id);assert.equal(f.role,'cleaner');
assert.throws(()=>mutate(s,'cleaner',{type:'guidance-feedback',sessionId:g2.id,comment:'nochmal'}),/bereits/);
mutate(s,'cleaner',{type:'guidance-start',pinId:'pin-sink',processId:'sp-seife'});const g3=s.guidance[0];mutate(s,'cleaner',{type:'guidance-step',id:g3.id,op:'exit'});assert.equal(g3.status,'done');assert.equal(g3.exited,true);});

test('Prozess bearbeiten bewahrt Hinweis und Dauer',()=>{const s=seed();const p=s.processes.find(p=>p.id==='sp-waschbecken')!;mutate(s,'owner',{type:'process',id:p.id,title:p.title,description:p.description,minutes:'4',steps:p.steps.map(st=>({...st}))});assert.equal(p.minutes,4);assert.equal(p.version,2);assert.ok(p.steps[0].caution);assert.throws(()=>mutate(s,'owner',{type:'process',id:p.id,title:p.title,minutes:'abc',steps:p.steps}),/Dauer/);});
