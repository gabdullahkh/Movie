import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const HOME='https://asurascans.com';
const UA='Mozilla/5.0 (compatible; AsuraLayout/1.0; +https://kh2030.vercel.app)';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'public, s-maxage=180, stale-while-revalidate=600'}});
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
function safePath(value) {
 if(typeof value!=='string'||value.length>400) return null;
 try{
  const u=new URL(value,HOME);
  if(u.origin!==HOME||!/^\/(?:comics(?:\/[a-zA-Z0-9-]+)?(?:\/chapter\/[a-zA-Z0-9.-]+)?|browse(?:\/.*)?|)$/.test(u.pathname))return null;
  return u.pathname+(u.search||'');
 }catch{return null;}
}
function imageFrom($,node){
 const el=$(node).find('img').first();
 const possible=[el.attr('data-src'),el.attr('data-lazy-src'),el.attr('src'),el.attr('srcset')?.split(',')[0]?.trim().split(' ')[0]];
 for(const src of possible){try{const url=new URL(src,HOME);if(url.protocol==='https:'&&/^(?:cdn\.)?asurascans\.com$/.test(url.hostname))return url.href;}catch{}}
 return null;
}
function listFrom($,limit=120){
 const seen=new Set(),list=[];
 $('a[href*="/comics/"]').each((_,a)=>{
  const href=safePath($(a).attr('href')||'');
  if(!href||!/^\/comics\/[^/]+$/.test(href)||seen.has(href))return;
  const img=imageFrom($,a);
  const text=clean($(a).text());
  const title=clean($(a).find('img').attr('alt')||$(a).find('h2,h3,h4').first().text()||text.replace(/^(?:\d+(?:\.\d+)?\s*)/,'').replace(/Chapter\s+\d+[\s\S]*$/i,'')).slice(0,120);
  if(!title||/^chapter\b/i.test(title)||/^(all comics|home|read the novel)$/i.test(title))return;
  seen.add(href);
  list.push({id:href,title,image:img,description:'',rating:(text.match(/\b(?:[0-9]\.\d|10\.0)\b/)||[])[0]||'',chapter:(text.match(/Chapter\s+[0-9]+(?:\.[0-9]+)?/i)||[])[0]||''});
 });
 // Cover images sometimes sit in a parent wrapping the link.
 for(const item of list){
  if(!item.image){
   const anchor=$('a[href]').filter((_,a)=>safePath($(a).attr('href')||'')===item.id).first();
   item.image=imageFrom($,anchor.parent())||imageFrom($,anchor.closest('article,li,[class*="card"]').first());
  }
 }
 return list.slice(0,limit);
}
async function getHtml(path) {
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),14000);
 try{
  const response=await fetch(HOME+path,{headers:{'User-Agent':UA,'Accept':'text/html','Accept-Language':'en-US,en;q=0.8'},signal:controller.signal,redirect:'error',cache:'no-store'});
  if(!response.ok)throw Error('AsuraScan returned HTTP '+response.status);
  const contentType=response.headers.get('content-type')||'';
  if(!contentType.includes('text/html'))throw Error('Unexpected content type from AsuraScan');
  const text=await response.text();
  if(text.length>6_000_000)throw Error('Source page too large');
  return text;
 }finally{clearTimeout(timeout);}
}
function parseComic($,path){
 const title=clean($('h1').first().text()||$('title').first().text().replace(/\s*\|.*/,''));
 const image=imageFrom($,$('main').first())||imageFrom($,$('body'));
 const chapterMap=new Map();
 $('a[href*="/chapter/"]').each((_,node)=>{
  const href=safePath($(node).attr('href')||'');
  if(!href||!href.startsWith(path+'/chapter/')||chapterMap.has(href))return;
  const label=clean($(node).text()).slice(0,130)||'Chapter';
  chapterMap.set(href,{url:href,label});
 });
 const text=clean($('main').text()||$('body').text());
 const description=clean($('meta[name="description"]').attr('content')||'');
 const rating=(text.match(/(?:Rating\s*)?(\d\.\d)\s*Rating/)||[])[1]||'';
 return {path,title,image,description,rating,chapters:[...chapterMap.values()]};
}
function parseChapter($,path){
 const images=[];
 $('main img, article img, [class*="reader"] img, [class*="chapter"] img').each((_,node)=>{
  const src=imageFrom($,$(node).parent());
  if(src&&!images.includes(src))images.push(src);
 });
 const title=clean($('h1').first().text()||$('title').first().text());
 const sibling=[];
 $('a[href*="/chapter/"]').each((_,a)=>{
  const href=safePath($(a).attr('href')||'');
  if(href&&href!==path&&!sibling.some(x=>x.path===href))sibling.push({path:href,label:clean($(a).text())});
 });
 return {path,title,images:images.slice(0,160),navigation:sibling.slice(0,20)};
}
export async function GET(request){
 const q=new URL(request.url).searchParams;
 const mode=q.get('mode')||'feed';
 const value=q.get('path')||'/comics';
 const path=safePath(value);
 if(!path)return json({error:'Invalid page path'},400);
 if(mode==='feed'&&path!=='/comics')return json({error:'Invalid catalog path'},400);
 if(mode==='comic'&&!/^\/comics\/[^/]+$/.test(path))return json({error:'Invalid comic path'},400);
 if(mode==='chapter'&&!/^\/comics\/[^/]+\/chapter\/[^/]+$/.test(path))return json({error:'Invalid chapter path'},400);
 if(!['feed','comic','chapter'].includes(mode))return json({error:'Unknown mode'},400);
 try{
  const $=cheerio.load(await getHtml(path));
  if(mode==='feed')return json({items:listFrom($),source:HOME+path});
  if(mode==='comic')return json(parseComic($,path));
  return json(parseChapter($,path));
 }catch(error){
  return json({error:'AsuraScan content is temporarily unavailable: '+error.message,source:HOME+path},502);
 }
}
