import { db } from './db';
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.siteSetting.findUnique({ where: { key } });
  return (row?.value as T | undefined) ?? fallback;
}
export async function getNav() {
  const nav = await db.navigationItem.findMany({ where: { visible: true, href: { not: '/legal' } }, orderBy: [{group:'asc'},{sortOrder:'asc'}] });
  return nav.length ? nav : [{id:'apps',label:'Apps',href:'/apps',group:'header',sortOrder:0,visible:true},{id:'about',label:'About',href:'/about',group:'header',sortOrder:1,visible:true},{id:'support',label:'Support',href:'/support',group:'header',sortOrder:2,visible:true},{id:'contact',label:'Contact',href:'/contact',group:'header',sortOrder:4,visible:true}];
}
