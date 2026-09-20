'use client';
import {useEffect,useRef} from 'react';import {createPortal} from 'react-dom';import {Check} from 'lucide-react';
import {useOverlayRoot,lockApp} from './overlay';
export type Action={label:string;detail?:string;onClick:()=>void;checked?:boolean;destructive?:boolean;disabled?:boolean};
export default function ActionSheet({open,title,message,actions,onClose,cancelLabel='Abbrechen'}:{open:boolean;title?:string;message?:string;actions:Action[];onClose:()=>void;cancelLabel?:string}){
const root=useOverlayRoot();const ref=useRef<HTMLDivElement>(null);
const close=useRef(onClose);close.current=onClose;
useEffect(()=>{if(!open||!root)return;const prev=document.activeElement as HTMLElement|null;const unlock=lockApp();const id=requestAnimationFrame(()=>ref.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus());const onKey=(e:KeyboardEvent)=>{if(e.key!=='Escape'||e.defaultPrevented)return;const layers=root.querySelectorAll('.sheet-layer.modal,.action-layer');if(layers[layers.length-1]?.contains(ref.current)){e.preventDefault();close.current();}};document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('keydown',onKey);cancelAnimationFrame(id);unlock();prev?.focus?.();};},[open,root]);
if(!root||!open)return null;
return createPortal(<div className="action-layer"><div className="sheet-scrim" onClick={onClose}/><div ref={ref} role="dialog" aria-modal="true" aria-label={title||'Aktionen'} className="action-sheet">
<div className="action-group">{(title||message)&&<div className="action-title">{title&&<strong>{title}</strong>}{message&&<span>{message}</span>}</div>}{actions.map(a=><button key={a.label} type="button" className={`action-item ${a.destructive?'destructive':''}`} disabled={a.disabled} aria-current={a.checked||undefined} onClick={()=>{onClose();a.onClick();}}><span>{a.label}{a.detail&&<small>{a.detail}</small>}</span>{a.checked&&<Check size={18}/>}</button>)}</div>
<div className="action-group"><button type="button" className="action-item cancel" onClick={onClose}>{cancelLabel}</button></div></div></div>,root);}
