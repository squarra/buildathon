'use client';
import type {LucideIcon} from 'lucide-react';
export type Tab<T extends string=string>={id:T;label:string;icon:LucideIcon;badge?:number};
export default function TabBar<T extends string>({items,active,onSelect}:{items:Tab<T>[];active:T;onSelect:(id:T)=>void}){
return <nav className="tab-bar" aria-label="Hauptnavigation">{items.map(t=><button key={t.id} type="button" className={`tab-item ${active===t.id?'active':''}`} aria-current={active===t.id?'page':undefined} onClick={()=>onSelect(t.id)}><span className="tab-icon"><t.icon size={26} strokeWidth={active===t.id?2.3:1.7}/>{t.badge?<span className="tab-badge">{t.badge}</span>:null}</span><span className="tab-label">{t.label}</span></button>)}</nav>;}
