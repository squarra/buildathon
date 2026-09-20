declare module 'pdf-parse/lib/pdf-parse.js' { const parse:(buffer:Buffer,options?:{max?:number})=>Promise<{text:string;numpages:number}>;export default parse; }
