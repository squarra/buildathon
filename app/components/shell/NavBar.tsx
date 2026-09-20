'use client';
import {ChevronLeft} from 'lucide-react';import type {ReactNode} from 'react';
export default function NavBar({title,back,trailing}:{title:string;back?:{label:string;onClick:()=>void};trailing?:ReactNode}){
return <header className="nav-bar"><div className="nav-side">{back&&<button type="button" className="nav-back" onClick={back.onClick}><ChevronLeft size={28} strokeWidth={2.2}/><span>{back.label}</span></button>}</div><div className="nav-title" aria-live="polite">{title}</div><div className="nav-side end">{trailing}</div></header>;}
