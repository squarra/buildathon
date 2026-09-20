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
