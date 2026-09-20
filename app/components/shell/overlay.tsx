'use client';
import {useEffect,useState,ReactNode} from 'react';import {createPortal} from 'react-dom';
export function overlayRoot(){let el=document.getElementById('ios-overlays');if(!el){el=document.createElement('div');el.id='ios-overlays';el.className='ios-overlays';document.body.appendChild(el);}return el;}
export function useOverlayRoot(){const [root,setRoot]=useState<HTMLElement|null>(null);useEffect(()=>{setRoot(overlayRoot());},[]);return root;}
export function Overlay({children}:{children:ReactNode}){const root=useOverlayRoot();return root?createPortal(children,root):null;}
let locks=0;const sync=()=>document.getElementById('ios-app')?.toggleAttribute('inert',locks>0);
export function lockApp(){locks++;sync();return()=>{locks--;sync();};}
export const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
