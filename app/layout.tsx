import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'SeasonUp · Wissen bleibt im Haus.',description:'SeasonUp bewahrt das Betriebswissen kleiner Ferienwohnungsbetriebe über Saisons und Personalwechsel hinweg.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de"><body>{children}</body></html>;}
