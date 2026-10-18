'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Play, ArrowLeft, Bookmark, Check, RotateCcw } from 'lucide-react';

const poster = (path, size='w500') => path ? 'https://image.tmdb.org/t/p/'+size+path : '';
const kindOf = item => item.media_type === 'tv' || item.first_air_date !== undefined || (item.name && !item.title) ? 'tv' : 'movie';
const idOf = item => kindOf(item)+':'+item.id;
const rowsConfig = [
  ['trending','Trending this week','trending/all/week'],
  ['movies','Popular movies','movie/popular'],
  ['shows','Popular TV shows','tv/popular'],
  ['topMovies','Top rated movies','movie/top_rated'],
  ['topShows','Top rated shows','tv/top_rated'],
  ['recentMovies','Now playing','movie/now_playing'],
  ['airing','Currently airing','tv/on_the_air']
];
const inputStyle={padding:'12px 14px',borderRadius:8,border:'1px solid #464750',background:'#202127',color:'#fff'};
const buttonStyle={padding:'11px 17px',borderRadius:8,border:'1px solid #444750',background:'#24262e',color:'white',cursor:'pointer'};
const redStyle={...buttonStyle,background:'#e50914',borderColor:'#e50914',fontWeight:750};
async function tmdb(path,params={}) {
 const q=new URLSearchParams({path,language:'en-US',...params});
 const r=await fetch('/api/tmdb?'+q);
 const data=await r.json();
 if(!r.ok)throw Error(data.error||'Unable to fetch TMDB titles');
 return data;
}
export default function MovyPage(){
 const [stage,setStage]=useState('login');
 const [loginAttempted,setLoginAttempted]=useState(false);
 const [tab,setTab]=useState('home');
 const [rows,setRows]=useState({});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const [found,setFound]=useState([]);
 const [searching,setSearching]=useState(false);
 const [selected,setSelected]=useState(null);
 const [details,setDetails]=useState(null);
 const [season,setSeason]=useState(1);
 const [episodes,setEpisodes]=useState([]);
 const [episode,setEpisode]=useState(1);
 const [player,setPlayer]=useState('');
 const [playerVersion,setPlayerVersion]=useState(0);
 const playerContainerRef=useRef(null);
 const [isFullscreen,setIsFullscreen]=useState(false);
 useEffect(()=>{
  const sync=()=>setIsFullscreen(document.fullscreenElement===playerContainerRef.current);
  document.addEventListener('fullscreenchange',sync);
  return()=>document.removeEventListener('fullscreenchange',sync);
 },[]);
 async function toggleFullscreen(){
  try{
   if(document.fullscreenElement===playerContainerRef.current){
    await document.exitFullscreen();
   }else if(playerContainerRef.current){
    await playerContainerRef.current.requestFullscreen();
   }
  }catch(err){
   console.error('Fullscreen unavailable',err);
  }
 }
 const [favourites,setFavourites]=useState([]);
 const [history,setHistory]=useState([]);
 const [showLogin,setShowLogin]=useState(false);
 useEffect(()=>{
  try{
   const saved=localStorage.getItem('movie.movy.catalogue');
   const data=saved?JSON.parse(saved):{};
   setFavourites(Array.isArray(data.favourites)?data.favourites:[]);
   setHistory(Array.isArray(data.history)?data.history:[]);
   if (data.rememberBrowsing === true) setStage('browse');
  }catch{}
 },[]);
 useEffect(()=>{
  if(stage!=='browse')return;
  let live=true;
  setLoading(true);
  Promise.all(rowsConfig.map(async([key,,path])=>{
   try{const d=await tmdb(path);return [key,d.results||[]];}catch{return[key,[]];}
  })).then(entries=>{if(live){setRows(Object.fromEntries(entries));setLoading(false);}});
  return()=>{live=false;};
 },[stage]);
 useEffect(()=>{
  if(stage!=='browse')return;
  if(!query.trim()){setFound([]);return;}
  let live=true;setSearching(true);
  const timeout=setTimeout(()=>{
   tmdb('search/multi',{query:query.trim()}).then(d=>{if(live)setFound((d.results||[]).filter(x=>(x.media_type==='movie'||x.media_type==='tv')&&x.poster_path));}).catch(()=>{if(live)setFound([]);}).finally(()=>{if(live)setSearching(false);});
  },300);
  return()=>{live=false;clearTimeout(timeout);};
 },[query,stage]);
 useEffect(()=>{
  if(!selected)return;
  let live=true;setDetails(null);setEpisodes([]);setEpisode(1);setSeason(1);
  const kind=kindOf(selected);
  tmdb(kind+'/'+selected.id).then(d=>{if(live)setDetails(d);}).catch(()=>{});
  return()=>{live=false;};
 },[selected]);
 useEffect(()=>{
  if(!selected || kindOf(selected)!=='tv')return;
  let live=true;
  tmdb('tv/'+selected.id+'/season/'+season).then(d=>{if(live)setEpisodes(d.episodes||[]);}).catch(()=>{if(live)setEpisodes([]);});
  return()=>{live=false;};
 },[selected,season]);
 function save(f,h){
  setFavourites(f);setHistory(h);
  localStorage.setItem('movie.movy.catalogue',JSON.stringify({favourites:f,history:h,rememberBrowsing:true}));
 }
 function toggleFavourite(item){
  const exists=favourites.some(x=>idOf(x)===idOf(item));
  save(exists?favourites.filter(x=>idOf(x)!==idOf(item)):[item,...favourites],history);
 }
 function launch(item,s=season,e=episode){
  const kind=kindOf(item);
  // Movy keeps the real video and login session inside its own iframe.
  const url=kind==='tv'
   ? 'https://www.movy.sx/tv/'+item.id
   : 'https://www.movy.sx/movie/'+item.id;
  const seen={...item,media_type:kind,season:kind==='tv'?s:null,episode:kind==='tv'?e:null};
  const next=[seen,...history.filter(x=>idOf(x)!==idOf(item))].slice(0,30);
  save(favourites,next);
  setPlayer(url);setPlayerVersion(v=>v+1);
 }
 function card(item,index){
  return <button key={idOf(item)+'-'+index} className="tile" onClick={()=>{setSelected(item);setPlayer('');window.scrollTo({top:0,behavior:'smooth'});}} aria-label={item.title||item.name}>
   {item.poster_path?<img alt={item.title||item.name||'Poster'} loading="lazy" src={poster(item.poster_path)}/>:<span className="no-poster">{item.title||item.name}</span>}
   <span className="tile-overlay"><strong>{item.title||item.name}</strong><span>{kindOf(item)==='tv'?'TV show':'Movie'} · {item.vote_average?Number(item.vote_average).toFixed(1):'—'} ★</span></span>
  </button>;
 }
 function goBrowse(){
  setStage('browse');setSelected(null);setTab('home');setPlayer('');
  localStorage.setItem('movie.movy.catalogue', JSON.stringify({favourites,history,rememberBrowsing:true}));
 }
 const featured=rows.trending?.find(x=>x.backdrop_path);
 const shown=query.trim()?found:tab==='movies'?rows.movies:tab==='tv'?rows.shows:tab==='list'?favourites:tab==='history'?history:null;
 return <main style={{background:'#08090d',minHeight:'100vh',color:'white'}}>
  <header className="topbar">
   <button className="brand" onClick={()=>{if(stage==='browse'){setSelected(null);setTab('home');setPlayer('');}}}>MOVY<span>.</span></button>
   {stage==='browse'&&<nav className="main-nav">
    {[['home','Home'],['movies','Movies'],['tv','TV Shows'],['list','My List'],['history','Continue watching']].map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>{setTab(key);setSelected(null);setQuery('');setPlayer('');}}>{label}</button>)}
   </nav>}
   <div className="nav-actions">
    {stage==='browse'&&<div className="searchbox"><Search size={18}/><input aria-label="Search titles" placeholder="Search movies and shows" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);setPlayer('');}}/></div>}
    <Link href="/" style={{...buttonStyle,textDecoration:'none',fontSize:13}}>Movie home</Link>
   </div>
  </header>
  {stage==='login'?<section style={{maxWidth:880,margin:'38px auto',padding:'0 22px'}}>
   <h1 style={{fontSize:35,marginBottom:10}}>Movy website</h1>
   <p style={{color:'#b8bbc5',lineHeight:1.6}}>Browse Movy inside the frame below, then continue to the catalogue. Movy controls its own account and session, if required.</p>
   <div style={{border:'1px solid #393c46',borderRadius:12,overflow:'hidden',marginTop:20,background:'#000'}}>
    <iframe src="https://www.movy.sx/" title="Movy email login" allow="autoplay; fullscreen; picture-in-picture" style={{display:'block',width:'100%',height:530,border:0}} onLoad={()=>setLoginAttempted(true)}/>
   </div>
   <p style={{color:'#aeb1bd',fontSize:13}}>Continue to the Movie-style catalogue. Embedded playback depends on Movy allowing this website to display its pages.</p>
   <button onClick={goBrowse} style={{...redStyle,marginTop:12}}>Continue to Movy catalogue</button>
  </section>:<>
   {!selected&&tab==='home'&&!query.trim()&&featured&&<section className="hero" style={{backgroundImage:'linear-gradient(90deg,#08090df5,#08090d77 62%),linear-gradient(0deg,#08090d,transparent 45%),url('+poster(featured.backdrop_path,'original')+')'}}>
    <div className="hero-content"><span className="eyebrow">Movy catalogue</span><h1>{featured.title||featured.name}</h1><p>{featured.overview}</p><div className="hero-buttons"><button className="primary" onClick={()=>setSelected(featured)}><Play size={18}/> Details & play</button></div></div>
   </section>}
   {!selected&&(query.trim()||tab!=='home')&&<section className="content results-page">
    <h1 style={{fontSize:30,marginBottom:24}}>{query?'Search results':tab==='movies'?'Popular movies':tab==='tv'?'Popular TV shows':tab==='list'?'My List':'Continue watching'}</h1>
    {searching&&<p style={{color:'#bbb'}}>Searching...</p>}
    {!searching&&<div className="poster-grid">{(shown||[]).filter(x=>x.poster_path).map(card)}</div>}
    {!searching&&!(shown||[]).length&&<p className="empty">No titles found.</p>}
   </section>}
   {!selected&&tab==='home'&&!query.trim()&&<div className="content home-rows">
    {loading&&<p className="loading">Loading catalogue...</p>}
    {history.length>0&&<section className="shelf"><h2>Continue watching</h2><div className="strip">{history.filter(x=>x.poster_path).slice(0,15).map(card)}</div></section>}
    {rowsConfig.map(([key,label])=><section key={key} className="shelf"><h2>{label}</h2><div className="strip">{(rows[key]||[]).filter(x=>x.poster_path).slice(0,22).map(card)}</div></section>)}
   </div>}
   {selected&&<section className="detail-page">
    <button className="back" onClick={()=>{setSelected(null);setPlayer('');}}><ArrowLeft size={17}/> Back to browsing</button>
    <div className="detail-hero" style={{backgroundImage:'linear-gradient(0deg,#08090d,#08090d77),url('+poster(details?.backdrop_path||selected.backdrop_path,'original')+')'}}/>
    <div className="detail-info">
     <div className="detail-poster">{selected.poster_path&&<img src={poster(selected.poster_path)} alt="Poster"/>}</div>
     <div className="detail-body">
      <h1>{details?.title||details?.name||selected.title||selected.name}</h1>
      <p className="facts">{kindOf(selected)==='tv'?'TV show':'Movie'} · {(details?.release_date||details?.first_air_date||selected.release_date||selected.first_air_date||'').slice(0,4)} · ★ {(details?.vote_average||selected.vote_average||0).toFixed(1)}</p>
      <p className="synopsis">{details?.overview||selected.overview}</p>
      <div className="actions">
       {kindOf(selected)==='movie'&&<button className="primary" onClick={()=>launch(selected)}><Play size={17}/> Watch on Movy</button>}
       <button className="secondary" onClick={()=>toggleFavourite(selected)}>{favourites.some(x=>idOf(x)===idOf(selected))?<Check size={17}/>:<Bookmark size={17}/>} {favourites.some(x=>idOf(x)===idOf(selected))?'Saved':'My List'}</button>
      </div>
     </div>
    </div>
    {kindOf(selected)==='tv'&&<section className="season-area"><h2>Episodes</h2>
     <label>Season <select style={{...inputStyle,marginLeft:12}} value={season} onChange={e=>{setSeason(Number(e.target.value));setEpisode(1);setPlayer('');}}>{Array.from({length:Math.min(details?.number_of_seasons||1,40)},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
     <div className="episode-list" style={{marginTop:18}}>{episodes.map(ep=><button key={ep.id||ep.episode_number} className="episode-card" onClick={()=>{setEpisode(ep.episode_number);launch(selected,season,ep.episode_number);}}>
      {ep.still_path?<img src={poster(ep.still_path,'w300')} alt=""/>:<div className="still-placeholder">Episode {ep.episode_number}</div>}
      <div><h3>{ep.episode_number}. {ep.name}</h3><p>{ep.overview||'Open TV show on Movy and select the episode'}</p></div><Play size={18}/></button>)}</div>
    </section>}
    {player&&<section style={{padding:'20px 5% 80px'}}>
     <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14,marginBottom:13}}>
      <h2 style={{margin:0}}>Movy playback {kindOf(selected)==='tv'?' · S'+season+' E'+episode:''}</h2>
      <div style={{display:'flex',gap:9,flexWrap:'wrap'}}><button style={buttonStyle} onClick={()=>setPlayerVersion(v=>v+1)}><RotateCcw size={15}/> Reload player</button><button type="button" style={buttonStyle} onClick={toggleFullscreen}>{isFullscreen?'Exit fullscreen':'Fullscreen ⛶'}</button></div>
     </div>
     <div ref={playerContainerRef} style={{aspectRatio:isFullscreen?'auto':'16/9',width:isFullscreen?'100vw':'100%',height:isFullscreen?'100vh':'auto',background:'#000',border:isFullscreen?'none':'1px solid #32343d',borderRadius:isFullscreen?0:12,overflow:'hidden',maxWidth:isFullscreen?'none':1150,position:'relative'}}>
      <iframe key={player+':'+playerVersion} src={player} title="Movy player" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen style={{width:'100%',height:'100%',border:0}}/>
     </div>
     <p style={{color:'#aab0bb',fontSize:13}}>Playback displays Movy's official title page inside a frame, not a direct stream. Movy may restrict embedding. Select an episode inside Movy if the show page supports it.</p>
     <button style={buttonStyle} onClick={()=>{setStage('login');setPlayer('');}}>Movy website</button>
    </section>}
   </section>}
   {!selected&&<div style={{padding:'15px 5% 45px',display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
    <span style={{color:'#9da1ae',fontSize:12}}>Browsing information: TMDB · Embedded title pages: Movy</span>
    <button style={buttonStyle} onClick={()=>setStage('login')}>Movy sign-in</button>
   </div>}
  </>}
 </main>;
}
