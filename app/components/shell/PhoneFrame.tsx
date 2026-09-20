'use client';
import {useEffect,useRef,useState,ReactNode} from 'react';import {Signal,Wifi,BatteryFull} from 'lucide-react';
const DEV_W=426,DEV_H=880,PAD=40;
/* Presentation-only iPhone frame. The app inside must not depend on it: on touch devices and narrow windows the CSS
   turns the frame off and the screen fills the viewport. #ios-overlays is the portal root for every overlay. */
export default function PhoneFrame({children}:{children:ReactNode}){
const stage=useRef<HTMLDivElement>(null);const [time,setTime]=useState('');
useEffect(()=>{const tick=()=>setTime(new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}));tick();const t=setInterval(tick,15000);return()=>clearInterval(t);},[]);
useEffect(()=>{const el=stage.current;if(!el)return;const fit=()=>{const s=Math.min(1,(el.clientWidth-PAD)/DEV_W,(el.clientHeight-PAD)/DEV_H);el.style.setProperty('--phone-scale',Math.max(.35,s).toFixed(3));};const ro=new ResizeObserver(fit);ro.observe(el);fit();return()=>ro.disconnect();},[]);
return <div ref={stage} className="phone-stage"><div className="phone-device"><div className="phone-screen">
<div className="phone-status" aria-hidden="true"><span className="phone-time" suppressHydrationWarning>{time}</span><span className="phone-island"/><span className="phone-status-icons"><Signal size={16}/><Wifi size={16}/><BatteryFull size={20}/></span></div>
{children}
<div className="phone-home" aria-hidden="true"/>
<div id="ios-overlays" className="ios-overlays"/>
</div></div></div>;}
