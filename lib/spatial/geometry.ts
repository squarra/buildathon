import type {Point,Room} from './types';
export const clamp01=(n:number)=>Math.min(1,Math.max(0,n));
export function toNormalized(clientX:number,clientY:number,rect:{left:number;top:number;width:number;height:number}):Point{return {x:clamp01((clientX-rect.left)/rect.width),y:clamp01((clientY-rect.top)/rect.height)};}
export function pointInPolygon(p:Point,polygon:[number,number][]){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if((yi>p.y)!==(yj>p.y)&&p.x<(xj-xi)*(p.y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
export function roomAt(rooms:Room[],floorPlanId:string,p:Point){return rooms.find(r=>r.floorPlanId===floorPlanId&&pointInPolygon(p,r.polygon));}
export const validPoint=(p:any):p is Point=>!!p&&typeof p.x==='number'&&typeof p.y==='number'&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
