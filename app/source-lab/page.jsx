'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const defaults={type:'movie',tmdbId:'',season:'1',episode:'1',provider:'all',quality:'all'};
const choices=['all','showbox','4khdhub','vixsrc','videasy','vidlink','dahmermovies','streamflix','vaplayer','castletv','hdghartv','netmirror','onetouchtv','zxcstreams'];
export default function SourceLab(){
 const [settings,setSettings]=useState(defaults);
 const [results,setResults]=useState([]);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [playing,setPlaying]=useState('');
 const playerRef=useRef(null);
 useEffect(()=>{
  if(!playing||!playing.includes('.m3u8')||!playerRef.current)return;
  const video=playerRef.current;
  if(video.canPlayType('application/vnd.apple.mpegurl')){video.src=playing;return;}
  let hls,live=true;
  import('hls.js').then(mod=>{
   if(!live)return;
   const Hls=mod.default;
   if(!Hls.isSupported())return;
   hls=new Hls();hls.loadSource(playing);hls.attachMedia(video);
  }).catch(()=>{});
  return()=>{live=false;hls?.destroy();};
 },[playing]);
 const [health,setHealth]=useState('');
 useEffect(()=>{try{setSettings({...defaults,...JSON.parse(localStorage.getItem('movie.sourceLab.settings')||'{}')});}catch{}},[]);
 function edit(key,value){setSettings(prev=>{const next={...prev,[key]:value};localStorage.setItem('movie.sourceLab.settings',JSON.stringify(next));return next;});}
 async function request(action,values){
  const params=new URLSearchParams({action,...values});
  const response=await fetch('/api/source-lab?'+params.toString(),{cache:'no-store'});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'Request failed');
  return data;
 }
 async function check(){setHealth('Checking...');try{const data=await request('health',{});setHealth('API connected: '+JSON.stringify(data).slice(0,180));}catch(e){setHealth(e.message);}}
 async function search(e){
  e.preventDefault();setBusy(true);setMessage('');setResults([]);setPlaying('');
  try{
   const data=await request('streams',settings);
   const streams=Array.isArray(data)?data:Array.isArray(data.streams)?data.streams:Array.isArray(data.results)?data.results:Array.isArray(data.data)?data.data:[];
   const filtered=streams.filter(x=>settings.quality==='all'||x.quality==='Auto'||Number(String(x.quality||'').match(/\d+/)?.[0]||0)>=Number(settings.quality));
   setResults(filtered);
   setMessage(filtered.length?'Found '+filtered.length+' source(s).':'No playable sources returned for this title.');
  }catch(err){setMessage(err.message);}finally{setBusy(false);}
 }
 const field={width:'100%',background:'#1b1d25',color:'white',border:'1px solid #4a4c58',borderRadius:8,padding:12};
 const label={display:'grid',gap:7,fontSize:13,color:'#c6c8d1'};
 return <main style={{minHeight:'100vh',background:'#090a0f',color:'white',padding:'28px max(4%, 18px)',fontFamily:'Arial,sans-serif'}}>
  <header style={{display:'flex',gap:18,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',marginBottom:30}}>
   <div><h1 style={{margin:'0 0 7px',fontSize:28}}>Source Lab <span style={{fontSize:12,color:'#ff838b'}}>BETA · SEPARATE</span></h1><p style={{margin:0,color:'#aeb1bd'}}>Independent stream provider testing. Your main Movie player is unchanged.</p></div>
   <Link href="/" style={{color:'white',textDecoration:'none',background:'#292b34',padding:'12px 16px',borderRadius:8}}>← Back to Movie</Link>
  </header>
  <section style={{maxWidth:1050,background:'#14161d',border:'1px solid #343642',padding:22,borderRadius:13}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:20}}><h2 style={{margin:0,fontSize:20}}>Independent settings</h2><button type="button" onClick={check} style={{...field,width:'auto',cursor:'pointer'}}>Check API connection</button></div>
   {health&&<p style={{color:'#c6c8d1',overflowWrap:'anywhere'}}>{health}</p>}
   <form onSubmit={search}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:15}}>
     <label style={label}>Content type<select style={field} value={settings.type} onChange={e=>edit('type',e.target.value)}><option value="movie">Movie</option><option value="series">TV series</option></select></label>
     <label style={label}>TMDB ID<input style={field} type="number" min="1" required placeholder="e.g. 278" value={settings.tmdbId} onChange={e=>edit('tmdbId',e.target.value)}/></label>
     {settings.type==='series'&&<><label style={label}>Season<input type="number" style={field} min="1" value={settings.season} onChange={e=>edit('season',e.target.value)}/></label><label style={label}>Episode<input type="number" style={field} min="1" value={settings.episode} onChange={e=>edit('episode',e.target.value)}/></label></>}
     <label style={label}>Provider<select style={field} value={settings.provider} onChange={e=>edit('provider',e.target.value)}>{choices.map(x=><option key={x} value={x}>{x==='all'?'All enabled providers':x}</option>)}</select></label>
     <label style={label}>Minimum quality<select style={field} value={settings.quality} onChange={e=>edit('quality',e.target.value)}>{['all','480','720','1080','1440','2160'].map(x=><option key={x} value={x}>{x==='all'?'Any quality':x+'p'}</option>)}</select></label>
    </div>
    <div style={{display:'flex',gap:10,marginTop:20,flexWrap:'wrap'}}><button disabled={busy} style={{background:'#e50914',color:'#fff',border:0,borderRadius:8,padding:'13px 20px',fontWeight:700,cursor:'pointer'}}>{busy?'Searching...':'Find streams'}</button><button type="button" style={{...field,width:'auto',cursor:'pointer'}} onClick={()=>{setSettings(defaults);localStorage.removeItem('movie.sourceLab.settings');setResults([]);setPlaying('');setMessage('Settings reset.');}}>Reset settings</button></div>
   </form>
  </section>
  {message&&<p role="status" style={{marginTop:24,color:'#d5d7df'}}>{message}</p>}
  {playing&&<section style={{maxWidth:1050,marginTop:20}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><h2>Preview</h2><button onClick={()=>setPlaying('')} style={{...field,width:'auto'}}>Close player</button></div><video ref={playerRef} key={playing} src={playing.includes('.m3u8')?undefined:playing} controls playsInline autoPlay style={{width:'100%',aspectRatio:'16/9',background:'black',borderRadius:10}}/></section>}
  <section style={{maxWidth:1050,display:'grid',gap:12,marginTop:22}}>
   {results.map((x,i)=><article key={i} style={{background:'#171920',border:'1px solid #353743',borderRadius:10,padding:17,display:'flex',gap:15,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
    <div><strong>{x.title||x.name||'Video source '+(i+1)}</strong><p style={{margin:'8px 0 0',color:'#adb0bc',fontSize:13}}>Provider: {x.provider||'Unknown'} · Quality: {x.quality||'Unknown'} · Subtitles: {Array.isArray(x.subtitles)?x.subtitles.map(s=>s.lang||s.language).filter(Boolean).join(', ')||'Not listed':'Not listed'}</p></div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{typeof x.url==='string'&&/^https?:\/\//.test(x.url)&&<><button style={{...field,width:'auto'}} onClick={()=>setPlaying(x.url)}>Preview</button><a href={x.url} target="_blank" rel="noreferrer" style={{color:'white',background:'#31333d',borderRadius:8,padding:12,textDecoration:'none'}}>Open source ↗</a></>}</div>
   </article>)}
  </section>
  <p style={{maxWidth:1050,color:'#858995',fontSize:12,marginTop:26}}>This page keeps settings in this browser only. External URLs may need special headers or HLS support and may not play in the browser.</p>
 </main>;
}