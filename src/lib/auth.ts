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
export async function sameOrigin(req:Request){const origin=req.headers.get('origin');if(!origin)return false;try{return new URL(origin).host===new URL(process.env.APP_URL??req.url).host}catch{return false}}
export { hash };
