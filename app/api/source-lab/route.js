import { NextResponse } from 'next/server';
export const dynamic='force-dynamic';
export async function GET(request){
 const base=process.env.TMDBEAPI_URL;
 if(!base)return NextResponse.json({error:'TMDBEAPI_URL is not configured in Vercel. Deploy the TMDBEAPI backend separately and set its HTTPS base URL in the Movie project environment variables.'},{status:503});
 let root;
 try{root=new URL(base);if(root.protocol!=='https:'&&!(root.hostname==='localhost'&&root.protocol==='http:'))throw Error('HTTPS required');}
 catch{return NextResponse.json({error:'Invalid TMDBEAPI_URL configuration.'},{status:500});}
 const q=new URL(request.url).searchParams;
 const action=q.get('action');
 let path='';
 if(action==='health')path='/api/health';
 else if(action==='streams'){
  const type=q.get('type');
  const id=q.get('tmdbId');
  const provider=q.get('provider')||'all';
  if(!['movie','series'].includes(type)||!/^\d{1,12}$/.test(id||'')||!Number(id))return NextResponse.json({error:'Invalid movie or TV TMDB ID.'},{status:400});
  if(provider!=='all'&&!/^[a-z0-9]{2,30}$/.test(provider))return NextResponse.json({error:'Invalid provider.'},{status:400});
  path='/api/streams/'+(provider==='all'?'':provider+'/')+type+'/'+id;
  if(type==='series'){
   const season=q.get('season'),episode=q.get('episode');
   if(!/^\d{1,4}$/.test(season||'')||!/^\d{1,4}$/.test(episode||''))return NextResponse.json({error:'Invalid season or episode.'},{status:400});
   path+='?'+new URLSearchParams({season,episode});
  }
 }else return NextResponse.json({error:'Unknown action.'},{status:400});
 try{
  const target=new URL(path,root.origin);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  let response;
  try{response=await fetch(target,{headers:{Accept:'application/json'},cache:'no-store',signal:controller.signal});}finally{clearTimeout(timeout);}
  const body=await response.text();
  let data;try{data=JSON.parse(body);}catch{return NextResponse.json({error:'Backend returned a non-JSON response.'},{status:502});}
  return NextResponse.json(data,{status:response.ok?200:502,headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e.name==='AbortError'?'Provider API timed out.':'Provider API is unreachable.'},{status:502});}
}