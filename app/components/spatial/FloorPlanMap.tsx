'use client';
import {useRef,KeyboardEvent,PointerEvent} from 'react';
import {Plus} from 'lucide-react';
import type {FloorPlan,Room,Pin,Point,PinDraft} from '@/lib/spatial/types';
import {toNormalized,clamp01} from '@/lib/spatial/geometry';
type Props={plan:FloorPlan;rooms:Room[];pins:Pin[];selectedId?:string;onSelectPin?:(id:string)=>void;draft?:PinDraft;placing?:boolean;onDraftMove?:(p:Point)=>void;onDraftConfirm?:()=>void};
export const pad=(n:number)=>String(n).padStart(2,'0');
const pct=(n:number)=>`${(n*100).toFixed(3)}%`;
export default function FloorPlanMap({plan,rooms,pins,selectedId,onSelectPin,draft,placing,onDraftMove,onDraftConfirm}:Props){
const ref=useRef<HTMLDivElement>(null);const dragging=useRef(false);
const W=plan.width,H=plan.height;
const point=(e:{clientX:number;clientY:number})=>toNormalized(e.clientX,e.clientY,ref.current!.getBoundingClientRect());
const roomName=(id:string)=>rooms.find(r=>r.id===id)?.name||'';
const down=(e:PointerEvent<HTMLDivElement>)=>{if(!placing||!onDraftMove)return;dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);onDraftMove(point(e));};
const move=(e:PointerEvent<HTMLDivElement>)=>{if(dragging.current&&onDraftMove)onDraftMove(point(e));};
const up=()=>{dragging.current=false;};
const keys=(e:KeyboardEvent<HTMLButtonElement>)=>{if(!draft)return;const step=e.shiftKey?.05:.01;const d:Record<string,[number,number]>={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};const m=d[e.key];if(m&&onDraftMove){e.preventDefault();onDraftMove({x:clamp01(draft.x+m[0]),y:clamp01(draft.y+m[1])});}else if((e.key==='Enter'||e.key===' ')&&onDraftConfirm){e.preventDefault();onDraftConfirm();}};
return <div ref={ref} className={`sp-map ${placing?'sp-placing':''}`} style={{aspectRatio:`${W} / ${H}`}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
<svg className="sp-plan" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Schematischer Grundriss ${plan.title}. Räume: ${rooms.map(r=>r.name).join(', ')}. Möbel und Positionen sind Beispiele.`}>
{rooms.map(r=><polygon key={r.id} className={`sp-room sp-room-${r.tone}`} points={r.polygon.map(([x,y])=>`${(x*W).toFixed(1)},${(y*H).toFixed(1)}`).join(' ')}/>)}
<g dangerouslySetInnerHTML={{__html:plan.geometry}}/>
</svg>
{rooms.map(r=><span key={r.id} className="sp-room-label" style={{left:pct(r.label.x),top:pct(r.label.y)}}>{r.name}</span>)}
{pins.map(p=><button key={p.id} type="button" className={`sp-pin ${p.id===selectedId?'sp-selected':''}`} style={{left:pct(p.x),top:pct(p.y)}} aria-pressed={p.id===selectedId} aria-label={`${pad(p.number)} ${p.name}, ${roomName(p.roomId)}`} onClick={()=>onSelectPin?.(p.id)}><span>{pad(p.number)}</span></button>)}
{draft&&<button type="button" className="sp-pin sp-draft" style={{left:pct(draft.x),top:pct(draft.y)}} aria-label={`Neuer Pin${draft.name?` „${draft.name}“`:''}. Mit den Pfeiltasten verschieben, Enter bestätigt.`} onKeyDown={keys}><span><Plus size={15}/></span></button>}
</div>;}
