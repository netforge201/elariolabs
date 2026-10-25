import {getSetting} from './settings';
export async function getSocialLinks():Promise<Record<string,string>>{const value=await getSetting<unknown>('social.links',{});if(value&&typeof value==='object'&&!Array.isArray(value))return value as Record<string,string>;if(typeof value==='string'){try{const parsed=JSON.parse(value);if(parsed&&typeof parsed==='object')return parsed}catch{}}return{}}
