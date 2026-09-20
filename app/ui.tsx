'use client';
import {useEffect,useRef,ReactNode} from 'react';
import {X} from 'lucide-react';
import type {Role} from '@/lib/types';
export const format=(d:string)=>new Date(d).toLocaleDateString('de-DE',{day:'2-digit',month:'short'});
export const roleLabel=(r:Role)=>r==='owner'?'Lena':r==='staff'?'Jonas':'Mira';
export async function api(url:string,body?:any){const r=await fetch(url,body!==undefined?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);const d=await r.json();if(!r.ok)throw Error(d.error||'Die Aktion konnte nicht abgeschlossen werden.');return d;}
export function Badge({children,tone='green'}:{children:ReactNode;tone?:string}){return <span className={`badge ${tone}`}>{children}</span>}
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();},[]);return <dialog ref={ref} className={wide?'modal wide':'modal'} onCancel={onClose}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Schließen"><X size={20}/></button></div>{children}</dialog>}
// Fotos vom Telefon sind mehrere Megabyte groß. Verkleinern spart Uploadzeit und Tokens beim Bildmodell.
export async function shrink(file:File,max=1280){try{const bitmap=await createImageBitmap(file);const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/jpeg',0.82));if(!blob)return file;return new File([blob],file.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'});}catch{return file;}}
