import type {Metadata,Viewport} from 'next';import './globals.css';import PhoneFrame from './components/shell/PhoneFrame';
export const metadata:Metadata={title:'Saisonwissen · Wissen bleibt. Menschen kommen an.',description:'Wissen und Abläufe für kleine Ferienwohnungsbetriebe.',icons:{icon:'/favicon.svg'},appleWebApp:{capable:true,statusBarStyle:'default',title:'Saisonwissen'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f2f2f7',interactiveWidget:'resizes-content'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de"><body><PhoneFrame>{children}</PhoneFrame></body></html>;}
