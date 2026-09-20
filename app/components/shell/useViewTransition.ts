'use client';
import {useRef} from 'react';
/* tab→tab = fade, tab→sub-view = push, sub-view→tab = pop. Idempotent ref update so StrictMode double-render is safe. */
export function useViewTransition(view:string,isTab:(v:string)=>boolean){const prev=useRef(view);const dir=useRef<'fade'|'push'|'pop'>('fade');if(prev.current!==view){const a=isTab(prev.current),b=isTab(view);dir.current=a&&b?'fade':b?'pop':'push';prev.current=view;}return `ios-view ios-${dir.current}`;}
