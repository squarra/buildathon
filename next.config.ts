import type {NextConfig} from 'next';
const config:NextConfig={distDir:process.env.BUILD_CHECK==='1'?'.next-check':'.next',outputFileTracingRoot:process.cwd(),devIndicators:false,serverExternalPackages:['pdf-parse']};
export default config;
