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
