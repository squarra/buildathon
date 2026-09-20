'use client';
import {useEffect,useRef,useState,ReactNode,PointerEvent as PE,KeyboardEvent as KE,CSSProperties} from 'react';
import {createPortal} from 'react-dom';import {X} from 'lucide-react';
import {useOverlayRoot,lockApp,FOCUSABLE} from './overlay';
export type Detent='peek'|'half'|'full';
type Props={open?:boolean;title?:string;subtitle?:string;label?:string;children:ReactNode;onClose?:()=>void;modal?:boolean;detents?:Detent[];detent?:Detent;onDetentChange?:(d:Detent)=>void;peekHeight?:number;footer?:ReactNode;className?:string};
type Drag={y:number;h:number;t:number;v:number;k:number;moved:boolean};
export default function Sheet({open=true,title,subtitle,label,children,onClose,modal=true,detents=['full'],detent,onDetentChange,peekHeight=176,footer,className=''}:Props){
const root=useOverlayRoot();const ref=useRef<HTMLDivElement>(null);const drag=useRef<Drag|null>(null);
const [inner,setInner]=useState<Detent>(detents[detents.length-1]);const cur=detent||inner;
const set=(d:Detent)=>{if(!detents.includes(d))return;setInner(d);onDetentChange?.(d);};
const close=useRef(onClose);close.current=onClose;
/* Escape is handled at document level so it works even when focus fell back to body (e.g. a focused button got disabled). */
useEffect(()=>{if(!open||!modal||!root)return;const prev=document.activeElement as HTMLElement|null;const unlock=lockApp();const id=requestAnimationFrame(()=>ref.current?.focus({preventScroll:true}));const onKey=(e:KeyboardEvent)=>{if(e.key!=='Escape'||e.defaultPrevented)return;const layers=root.querySelectorAll('.sheet-layer.modal,.action-layer');if(layers[layers.length-1]?.contains(ref.current)){e.preventDefault();close.current?.();}};document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('keydown',onKey);cancelAnimationFrame(id);unlock();prev?.focus?.({preventScroll:true});};},[open,modal,root]);
const px=(d:Detent)=>{const H=root?.clientHeight||window.innerHeight;return d==='peek'?peekHeight:d==='half'?Math.round(H*.5):H;};
const toggle=()=>set(cur==='full'?(detents.find(d=>d!=='full')||'full'):'full');
const key=(e:KE<HTMLDivElement>)=>{if(e.key==='Escape'){if(!modal){e.stopPropagation();set(detents[0]);}return;}if(e.key!=='Tab'||!modal||!ref.current)return;const f=[...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];if(!f.length)return;const a=document.activeElement;if(e.shiftKey&&(a===f[0]||a===ref.current)){e.preventDefault();f[f.length-1].focus();}else if(!e.shiftKey&&a===f[f.length-1]){e.preventDefault();f[0].focus();}};
/* Drag starts only in the grab zone. Buttons other than the grabber keep native clicks (no pointer capture), so the
   close button works; the grabber's own click handler only reacts to keyboard-initiated clicks (detail===0). */
const down=(e:PE<HTMLDivElement>)=>{const el=ref.current;if(!el||e.button!==0)return;const b=(e.target as HTMLElement).closest('button');if(b&&!b.classList.contains('sheet-grabber'))return;e.currentTarget.setPointerCapture(e.pointerId);const k=el.getBoundingClientRect().height/el.offsetHeight||1;drag.current={y:e.clientY,h:el.offsetHeight,t:e.timeStamp,v:0,k,moved:false};el.style.transition='none';};
const move=(e:PE<HTMLDivElement>)=>{const d=drag.current,el=ref.current;if(!d||!el)return;const dy=(e.clientY-d.y)/d.k;if(Math.abs(dy)>4)d.moved=true;d.v=dy/Math.max(1,e.timeStamp-d.t);el.style.height=`${Math.max(peekHeight*.5,Math.min(px('full'),d.h-dy))}px`;};
const up=(e:PE<HTMLDivElement>)=>{const d=drag.current,el=ref.current;drag.current=null;if(!d||!el)return;el.style.transition='';el.style.height='';if(!d.moved){toggle();return;}const h=d.h-(e.clientY-d.y)/d.k-d.v*150;const order=detents.map(x=>[x,px(x)] as const).sort((a,b)=>a[1]-b[1]);if(modal&&h<order[0][1]*.55){onClose?.();return;}let best=order[0];for(const o of order)if(Math.abs(o[1]-h)<Math.abs(best[1]-h))best=o;set(best[0]);};
if(!root||!open)return null;
return createPortal(<div className={`sheet-layer ${modal?'modal':'docked'}`}>{modal&&<div className="sheet-scrim" onClick={onClose}/>}
<div ref={ref} role="dialog" aria-modal={modal||undefined} aria-label={label||title} tabIndex={-1} data-detent={cur} className={`sheet ${className}`} style={{'--sheet-peek':`${peekHeight}px`} as CSSProperties} onKeyDown={key}>
<div className="sheet-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><button type="button" className="sheet-grabber" aria-label={cur==='full'?'Verkleinern':'Vergrößern'} aria-expanded={cur==='full'} onClick={e=>{if(e.detail===0)toggle();}} disabled={detents.length<2}/>
{(title||subtitle||modal)&&<div className="sheet-head"><div className="grow">{title&&<h2>{title}</h2>}{subtitle&&<p>{subtitle}</p>}</div>{modal&&onClose&&<button type="button" className="icon-button sheet-close" onClick={onClose} aria-label="Schließen"><X size={20}/></button>}</div>}</div>
<div className="sheet-body">{children}</div>{footer&&<div className="sheet-footer">{footer}</div>}</div></div>,root);}
