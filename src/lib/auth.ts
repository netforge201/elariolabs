import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './db';
const hash = (s:string) => createHash('sha256').update(s).digest('hex');
export async function currentAdmin() {
 const token=(await cookies()).get('elario_session')?.value;
 if(!token) return null;
 const row=await db.adminSession.findUnique({where:{tokenHash:hash(token)},include:{user:{include:{role:true}}}});
 if(!row || row.expiresAt < new Date() || !row.user.active) return null;
 return row.user;
}
export function newSessionToken(){return randomBytes(32).toString('base64url')}
export function publicBase(req:Request){
 const configured=process.env.APP_URL;
 if(configured){
  try{
   const url=new URL(configured);
   if(!['localhost','127.0.0.1','0.0.0.0'].includes(url.hostname))return url.origin;
   if(process.env.NODE_ENV!=='production')return url.origin;
  }catch{}
 }
 if(process.env.NODE_ENV==='production')return 'https://elariolabs.com';
 return new URL(req.url).origin;
}
export async function sameOrigin(req:Request){
 const origin=req.headers.get('origin');
 if(!origin)return false;
 try{
  const originUrl=new URL(origin);
  if(originUrl.protocol!=='http:'&&originUrl.protocol!=='https:')return false;
  // Deployzy and other reverse proxies may expose the public host in forwarded
  // headers while req.url (and APP_URL) still point at an internal hostname.
  const forwardedHost=req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const requestHost=(forwardedHost||req.headers.get('host')||new URL(req.url).host).toLowerCase();
  const publicHost=new URL(publicBase(req)).host.toLowerCase();
  return originUrl.host.toLowerCase()===requestHost||originUrl.host.toLowerCase()===publicHost;
 }catch{return false}
}
export { hash };
