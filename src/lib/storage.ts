import {S3Client,PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';

export interface MediaStorage {
 put(bytes:Buffer,mime:string,ext:string):Promise<{key:string;url:string;deleteUrl?:string}>;
 remove(key:string,deleteUrl?:string|null):Promise<void>;
}

export function mediaStorage():MediaStorage{
 const driver=process.env.STORAGE_DRIVER??'local';
 if(driver==='local'){
  if(process.env.NODE_ENV==='production'&&process.env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION!=='true')throw new Error('Production requires S3-compatible media storage.');
  const root=path.resolve(process.env.MEDIA_LOCAL_DIR??'./var/media');
  return {async put(bytes,mime,ext){const key=`${randomUUID()}.${ext}`;await mkdir(root,{recursive:true});await writeFile(path.join(root,key),bytes,{flag:'wx'});return{key,url:`/media/${key}`}},async remove(key){await unlink(path.join(root,path.basename(key))).catch(()=>{})}};
 }
 if(driver==='imgbb'){
  const apiKey=process.env.IMGBB_API_KEY;
  if(!apiKey)throw new Error('Set IMGBB_API_KEY to use ImgBB image storage.');
  return {
   async put(bytes,mime,ext){
    const form=new FormData();
    form.append('image',new Blob([new Uint8Array(bytes)],{type:mime}),`elariolabs.${ext}`);
    const response=await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,{method:'POST',body:form,cache:'no-store'});
    const result=await response.json() as {success?:boolean;data?:{url?:string;display_url?:string;delete_url?:string}};
    const url=result.data?.display_url||result.data?.url;
    if(!response.ok||!result.success||!url)throw new Error('ImgBB image upload failed. Check the API key and try again.');
    return{key:url,url,deleteUrl:result.data?.delete_url};
   },
   async remove(key,deleteUrl){
    if(deleteUrl){
     const target=new URL(deleteUrl);
     if(!['ibb.co','www.ibb.co'].includes(target.hostname))throw new Error('Invalid ImgBB deletion link.');
     const response=await fetch(target,{method:'GET',cache:'no-store'});
     if(!response.ok)throw new Error('ImgBB could not remove the image.');
     return;
    }
    if(!key.startsWith('http'))await unlink(path.join(path.resolve(process.env.MEDIA_LOCAL_DIR??'./var/media'),path.basename(key))).catch(()=>{});
   }
  };
 }
 if(driver!=='s3'||!process.env.S3_BUCKET)throw new Error('Configure STORAGE_DRIVER=s3 and S3_BUCKET.');
 const client=new S3Client({region:process.env.S3_REGION??'auto',endpoint:process.env.S3_ENDPOINT||undefined,forcePathStyle:!!process.env.S3_ENDPOINT,credentials:process.env.S3_ACCESS_KEY_ID?{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY??''}:undefined});
 return{async put(bytes,mime,ext){const key=`${randomUUID()}.${ext}`;await client.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET!,Key:key,Body:bytes,ContentType:mime,CacheControl:'public, max-age=31536000, immutable'}));const base=process.env.S3_PUBLIC_BASE_URL;if(!base)throw new Error('S3_PUBLIC_BASE_URL is required for public media.');return{key,url:`${base.replace(/\/$/,'')}/${key}`}},async remove(key){await client.send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET!,Key:key}))}};
}
