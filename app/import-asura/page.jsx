'use client';
import {useState} from 'react';
import Link from 'next/link';
const STORE='asura.reader.v1';
function parseLinks(value) {
 const found=new Map();
 const re=/https?:\/\/(?:www\.)?asurascans\.com\/comics\/([a-z0-9-]+)/gi;
 for(const match of value.matchAll(re)){
  const slug=match[1], id='/comics/'+slug;
  if(!found.has(id))found.set(id,{id,title:slug.replace(/-/g,' ').replace(/\b\w/g,x=>x.toUpperCase()),image:null});
 }
 return [...found.values()];
}
export default function ImportPage(){
 const [input,setInput]=useState('');
 const [status,setStatus]=useState('');
 function importLinks(){
  const items=parseLinks(input);
  if(!items.length){setStatus('No valid AsuraScan comic links found.');return;}
  try{
   const prior=JSON.parse(localStorage.getItem(STORE)||'{}');
   const existing=Array.isArray(prior.bookmarks)?prior.bookmarks:[];
   const existingMap=new Map(existing.map(x=>[x.id,x]));
   for(const x of items)if(!existingMap.has(x.id))existingMap.set(x.id,x);
   localStorage.setItem(STORE,JSON.stringify({...prior,bookmarks:[...existingMap.values()]}));
   setStatus('Imported '+items.length+' comic links. Open Panel to view your bookmarks.');
  }catch(e){setStatus('Import failed: '+e.message);}
 }
 return <main style={{minHeight:'100vh',background:'#0b0e15',color:'#f3f5fa',padding:'30px 18px',fontFamily:'Arial,sans-serif'}}>
  <section style={{maxWidth:650,margin:'0 auto'}}>
   <Link href="/" style={{color:'#c9bbff'}}>← Panel</Link>
   <h1 style={{marginTop:28}}>Import AsuraScan bookmarks</h1>
   <p style={{color:'#acb5c6',lineHeight:1.7}}>Sign in to AsuraScan using Google on its own website. Copy your comic links into the box below to import them into Panel. No password, cookies, or Premium tokens are transferred.</p>
   <p><a href="https://asurascans.com/bookmarks/comics" target="_blank" rel="noreferrer" style={{color:'#c9bbff'}}>Open my AsuraScan bookmarks ↗</a></p>
   <label htmlFor="links" style={{display:'block',fontWeight:700,margin:'25px 0 10px'}}>Comic links (one per line)</label>
   <textarea id="links" value={input} onChange={e=>setInput(e.target.value)} placeholder="https://asurascans.com/comics/example-series" style={{width:'100%',height:230,background:'#1b2331',color:'white',border:'1px solid #45506a',borderRadius:12,padding:14,fontSize:16}}/>
   <button onClick={importLinks} style={{background:'#c2b1ff',color:'#151123',border:0,borderRadius:9,padding:'13px 20px',fontWeight:750,marginTop:15}}>Import bookmarks</button>
   {status&&<p role="status" style={{background:'#24283b',borderRadius:9,padding:15}}>{status}</p>}
   <p style={{color:'#8d99b0',lineHeight:1.7,fontSize:13}}>This is a one-time, local bookmark import. Your Google sign-in remains on AsuraScan. Premium chapters must be viewed there while authenticated.</p>
  </section>
 </main>;
}
