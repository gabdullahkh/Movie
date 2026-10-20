import { NextResponse } from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const ORIGIN='https://asurascans.com';
const domain=/^(?:cdn\.)?asurascans\.com$/i;
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/<\/(?:div|span|p|h[1-6]|li|time|small|strong|section|a)>/gi,' ').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const json=(data,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'public,s-maxage=120,stale-while-revalidate=300'}});
const attr=(html,name)=>{const m=html.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\x27([^\x27]*)\x27)','i'));return m?.[1]||m?.[2]||''};
function pathOf(value){
 try{const url=new URL(value,ORIGIN);if(url.origin!==ORIGIN||!/^\/(?:comics(?:\/[a-z0-9-]+)?(?:\/chapter\/[a-z0-9.-]+)?|browse(?:\/comics)?)$/i.test(url.pathname))return null;return url.pathname;}catch{return null;}
}
function imageOf(value){
 try{const url=new URL(value,ORIGIN);if(url.protocol!=='https:'||!domain.test(url.hostname))return null;return url.href;}catch{return null;}
}
function allAnchors(html){
 return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(m=>({attrs:m[1],inside:m[2],href:pathOf(attr(m[1],'href'))}));
}
function images(html){
 const list=[];
 for(const m of html.matchAll(/<img\b([^>]*)>/gi)){
  const src=imageOf(attr(m[1],'data-src')||attr(m[1],'data-lazy-src')||attr(m[1],'src'));
  if(src)list.push({src,alt:decode(attr(m[1],'alt'))});
 }
 return list;
}
function feed(html){
 const found=new Map();
 const anchors=allAnchors(html);
 const imgs=images(html);
 for(const a of anchors){
  if(!a.href||!/^\/comics\/[^/]+$/.test(a.href)||found.has(a.href))continue;
  const nearby=images(a.inside);
  const text=decode(a.inside);
  const title=(nearby.find(x=>x.alt)?.alt||text.replace(/^\d+(?:\.\d+)?\s*/,'').replace(/Chapter\s+\d+[\s\S]*$/i,'')).trim().slice(0,140);
  if(!title||/^(all comics|home|read the novel)$/i.test(title))continue;
  const image=nearby[0]?.src||imgs.find(x=>x.alt===title)?.src||null;
  found.set(a.href,{id:a.href,title,image,chapter:(text.match(/Chapter\s+\d+(?:\.\d+)?/i)||[])[0]||'',rating:(text.match(/\b\d\.\d\b/)||[])[0]||''});
 }
 return [...found.values()].slice(0,140);
}
function comic(html,path){
 const title=decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||'');
 const description=decode(attr((html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)||[])[0]||'','content'));
 const cover=images(html).find(x=>x.alt===title)||images(html)[0];
 const chapters=new Map();
 for(const a of allAnchors(html)){
  if(!a.href?.startsWith(path+'/chapter/')||chapters.has(a.href))continue;
  const raw=decode(a.inside);
  const fromText=raw.match(/(?:^|\\b)chapter\\s*(\\d+(?:\\.\\d+)?)(?!\\d)/i);
  const slug=a.href.split('/').at(-1)||'';
  const fromUrl=slug.match(/(?:chapter[-_]?|^)(\\d+(?:\\.\\d+)?)(?:[-_]|$)/i);
  const number=fromText?Number(fromText[1]):fromUrl?Number(fromUrl[1]):null;
  const suffix=number===null?'':raw.replace(/^.*?chapter\\s*\\d+(?:\\.\\d+)?/i,'').replace(/\\b(?:just now|yesterday|today|last week|\\d+\\s*(?:minutes?|hours?|days?|weeks?|months?|years?)\\s*ago)\\b[\\s\\S]*$/i,'').trim();
  const label=number!==null?'Chapter '+number+(suffix&&suffix.length<65?' — '+suffix:''):raw.replace(/\\b(?:just now|last week|\\d+\\s*(?:days?|weeks?|months?|years?)\\s*ago)\\b[\\s\\S]*$/i,'').trim()||'Chapter';
  chapters.set(a.href,{url:a.href,label:label.slice(0,140),number});
 }
 return {path,title,image:cover?.src||null,description,chapters:[...chapters.values()]};
}
function chapter(html,path){
 const title=decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||'');
 const seen=new Set();
 const pics=[];
 for(const img of images(html)){
  if(!/page\s*\d+|chapter/i.test(img.alt))continue;
  if(!seen.has(img.src)){pics.push(img.src);seen.add(img.src);}
 }
 return {path,title,images:pics.slice(0,160)};
}
export async function GET(request){
 const q=new URL(request.url).searchParams;
 const mode=q.get('mode')||'feed',path=pathOf(q.get('path')||'/browse/comics');
 const page=Number(q.get('page')||1);
 if(!Number.isInteger(page)||page<1||page>30)return json({error:'Invalid page'},400);
 if(!path||!['feed','comic','chapter'].includes(mode))return json({error:'Invalid request'},400);
 if(mode==='feed'&&!['/comics','/browse','/browse/comics'].includes(path)||mode==='comic'&&!/^\/comics\/[^/]+$/.test(path)||mode==='chapter'&&!/^\/comics\/[^/]+\/chapter\/[^/]+$/.test(path))return json({error:'Invalid content path'},400);
 const controller=new AbortController();const t=setTimeout(()=>controller.abort(),13000);
 try{
  const r=await fetch(ORIGIN+path+(mode==='feed'?'?page='+page:''),{headers:{'Accept':'text/html','User-Agent':'Mozilla/5.0 (compatible; AsuraReader/1.0)'},redirect:'error',signal:controller.signal,cache:'no-store'});
  if(!r.ok)throw Error('Source returned HTTP '+r.status);
  if(!(r.headers.get('content-type')||'').includes('text/html'))throw Error('Unexpected response');
  const html=await r.text();
  if(html.length>6000000)throw Error('Source response too large');
  return json(mode==='feed'?{items:feed(html),page,hasMore:feed(html).length>=15}:mode==='comic'?comic(html,path):chapter(html,path));
 }catch(err){return json({error:'Source unavailable: '+err.message},502);}finally{clearTimeout(t);}
}
