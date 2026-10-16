'use client';
import { useCallback, useEffect, useState } from 'react';
import AccountPanel from '../components/AccountPanel';
import { supabase } from '../lib/supabase';
import { Search, Play, Plus, Check, X, Globe2, Bookmark, Clapperboard, Tv, Home, ArrowLeft, ArrowRight, Star, ChevronDown } from 'lucide-react';

const IMAGE='https://image.tmdb.org/t/p/';
const poster=(path,size='w500')=>path?IMAGE+size+path:null;
const category=(x)=>x.media_type==='tv'||(!x.media_type && (x.first_air_date!==undefined || x.name!==undefined))?'tv':'movie';
const labels={
 en:{home:'Home',movies:'Movies',tv:'TV Shows',myList:'My List',search:'Search movies and TV shows',trending:'Trending this week',popularMovies:'Popular movies',popularShows:'Popular TV shows',topMovies:'Top rated movies',topShows:'Top rated TV shows',netflix:'Latest on Netflix',prime:'Latest on Prime Video',disney:'Latest on Disney+',account:'Account',onAir:'Currently airing',nowPlaying:'Now playing',watch:'Watch Now',details:'More Info',add:'My List',remove:'Remove from list',seasons:'Seasons',episodes:'Episodes',episode:'Episode',continue:'Continue watching',back:'Back',allGenres:'All Genres',noResults:'No titles found.',emptyList:'Your list is empty. Add movies or shows to save them here.',loading:'Loading...',rating:'Rating',overview:'Overview',noOverview:'No description available.',unavailable:'Unable to load titles. Check TMDB API configuration.',playerNotice:'Playback is provided by a third-party website. Ads and external redirects are outside our control.',tmdb:'This product uses the TMDB API but is not endorsed or certified by TMDB.',close:'Close',searchResults:'Search results',browse:'Browse',selectEpisode:'Select an episode',more:'Show more',backHome:'Back to home'},
 ar:{home:'الرئيسية',movies:'أفلام',tv:'مسلسلات',myList:'قائمتي',search:'ابحث عن أفلام ومسلسلات',trending:'الرائج هذا الأسبوع',popularMovies:'أفلام شائعة',popularShows:'مسلسلات شائعة',topMovies:'أعلى الأفلام تقييماً',topShows:'أعلى المسلسلات تقييماً',netflix:'الأحدث على نتفليكس',prime:'الأحدث على برايم فيديو',disney:'الأحدث على ديزني+',account:'الحساب',onAir:'يعرض الآن',nowPlaying:'في السينما',watch:'شاهد الآن',details:'المزيد من التفاصيل',add:'إضافة إلى قائمتي',remove:'إزالة من قائمتي',seasons:'المواسم',episodes:'الحلقات',episode:'الحلقة',continue:'متابعة المشاهدة',back:'رجوع',allGenres:'كل الأنواع',noResults:'لا توجد نتائج.',emptyList:'قائمتك فارغة. أضف أفلاماً أو مسلسلات لحفظها هنا.',loading:'جاري التحميل...',rating:'التقييم',overview:'القصة',noOverview:'لا يوجد وصف متوفر.',unavailable:'تعذر تحميل البيانات. تحقق من إعدادات TMDB.',playerNotice:'المشاهدة عبر مشغل خارجي. الإعلانات والتحويلات خارج تحكمنا.',tmdb:'هذا المنتج يستخدم واجهة TMDB لكنه غير معتمد أو مدعوم من TMDB.',close:'إغلاق',searchResults:'نتائج البحث',browse:'تصفح',selectEpisode:'اختر الحلقة',more:'عرض المزيد',backHome:'العودة للرئيسية'}
};
function readStorage(key,fallback){try{const d=localStorage.getItem(key);return d?JSON.parse(d):fallback;}catch{return fallback;}}
const keyOf=(item)=>category(item)+':'+item.id;
export default function Page(){
 const [language,setLanguage]=useState('en');
 const t=labels[language],rtl=language==='ar';
 const [tab,setTab]=useState('home'),[query,setQuery]=useState(''),[searchResults,setSearchResults]=useState([]);
 const [rows,setRows]=useState({}),[genres,setGenres]=useState({movie:[],tv:[]}),[genre,setGenre]=useState('');
 const [selected,setSelected]=useState(null),[detail,setDetail]=useState(null),[season,setSeason]=useState(1),[seasonData,setSeasonData]=useState(null),[episode,setEpisode]=useState(null);
 const [watchlist,setWatchlist]=useState([]),[history,setHistory]=useState([]),[siteSettings,setSiteSettings]=useState({}),[busy,setBusy]=useState(true),[error,setError]=useState(''),[page,setPage]=useState(1);
 const [session,setSession]=useState(null),[accountOpen,setAccountOpen]=useState(false),[authLoaded,setAuthLoaded]=useState(false);
 const api=useCallback(async(path,params={})=>{const u=new URLSearchParams({path,language:language==='ar'?'ar-SA':'en-US',...params});const r=await fetch('/api/tmdb?'+u);const json=await r.json();if(!r.ok)throw Error(json.error||'Unable to fetch');return json;},[language]);
 useEffect(()=>{setWatchlist(readStorage('movie.watchlist',[]));setHistory(readStorage('movie.history',[]));setLanguage(readStorage('movie.language','en'));fetch('/api/settings').then(r=>r.json()).then(d=>setSiteSettings(d.settings||{})).catch(()=>{});},[]);
 useEffect(()=>{localStorage.setItem('movie.language',JSON.stringify(language));document.documentElement.lang=language;document.documentElement.dir=rtl?'rtl':'ltr';},[language,rtl]);
 // Anonymous lists are saved only when the viewer changes them, not during account transitions.
 useEffect(()=>{
   let alive=true;
   supabase.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setAuthLoaded(true);}});
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(alive){setSession(next);setAuthLoaded(true);}});
   return()=>{alive=false;subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
   if(!authLoaded)return;
   if(!session?.user?.id){
     setWatchlist(readStorage('movie.watchlist',[]));
     setHistory(readStorage('movie.history',[]));
     return;
   }
   let active=true;
   const uid=session.user.id;
   (async()=>{
     const {data,error}=await supabase.from('user_library').select('item_key,kind,payload').eq('user_id',uid);
     if(!active||error)return;
     const savedList=(data||[]).filter(x=>x.kind==='watchlist').map(x=>x.payload);
     const savedHistory=(data||[]).filter(x=>x.kind==='history').map(x=>x.payload);
     if(data.length===0){
       const localList=readStorage('movie.watchlist',[]);
       const localHistory=readStorage('movie.history',[]);
       const items=[
         ...localList.map(x=>({user_id:uid,kind:'watchlist',item_key:keyOf(x),payload:x})),
         ...localHistory.map(x=>({user_id:uid,kind:'history',item_key:keyOf(x),payload:x}))
       ];
       if(items.length) await supabase.from('user_library').upsert(items,{onConflict:'user_id,item_key,kind'});
       if(active){setWatchlist(localList);setHistory(localHistory);}
     }else{
       setWatchlist(savedList);
       setHistory(savedHistory.sort((a,b)=>(b.watchedAt||0)-(a.watchedAt||0)));
     }
   })();
   return()=>{active=false;};
 },[session?.user?.id,authLoaded]);
 useEffect(()=>{let alive=true;setBusy(true);setError('');const endpoints={trending:'trending/all/week',movies:'movie/popular',shows:'tv/popular',topMovies:'movie/top_rated',topShows:'tv/top_rated',now:'movie/now_playing',air:'tv/on_the_air'};
 const providers={netflix:8,prime:119,disney:337};
 const since=new Date(Date.now()-540*86400000).toISOString().slice(0,10);
 const today=new Date().toISOString().slice(0,10);
 Promise.all([...Object.entries(endpoints).map(async ([key,path])=>[key,(await api(path)).results||[]]),...['movie','tv'].map(async type=>['genre_'+type,(await api('genre/'+type+'/list')).genres||[]]),
 ...Object.entries(providers).map(async ([name,id])=>{
   try{
     const [movies,shows]=await Promise.all([
       api('discover/movie',{watch_region:'SA',with_watch_providers:String(id),with_watch_monetization_types:'flatrate',sort_by:'primary_release_date.desc','primary_release_date.gte':since,'primary_release_date.lte':today}),
       api('discover/tv',{watch_region:'SA',with_watch_providers:String(id),with_watch_monetization_types:'flatrate',sort_by:'first_air_date.desc','first_air_date.gte':since,'first_air_date.lte':today})
     ]);
     let items=[...(movies.results||[]).map(x=>({...x,media_type:'movie'})),...(shows.results||[]).map(x=>({...x,media_type:'tv'}))];
     if(items.length===0){
       const backup=await Promise.allSettled([
         api('discover/movie',{watch_region:'SA',with_watch_providers:String(id),with_watch_monetization_types:'flatrate',sort_by:'popularity.desc'}),
         api('discover/tv',{watch_region:'SA',with_watch_providers:String(id),with_watch_monetization_types:'flatrate',sort_by:'popularity.desc'})
       ]);
       items=backup.flatMap((result,index)=>result.status==='fulfilled'?(result.value.results||[]).map(x=>({...x,media_type:index===0?'movie':'tv'})):[]);
     }
     return [name,items.sort((a,b)=>((b.release_date||b.first_air_date||'').localeCompare(a.release_date||a.first_air_date||'')))];
   }catch{return[name,[]];}
 })]).then(out=>{if(!alive)return;const o=Object.fromEntries(out);setRows(o);setGenres({movie:o.genre_movie,tv:o.genre_tv});setBusy(false);}).catch(e=>{if(alive){setError(e.message);setBusy(false);}});return()=>{alive=false;};},[api]);
 useEffect(()=>{if(!query.trim()){setSearchResults([]);return;}let active=true;const timer=setTimeout(()=>{api('search/multi',{query}).then(data=>{if(active)setSearchResults((data.results||[]).filter(v=>v.media_type==='movie'||v.media_type==='tv'));}).catch(()=>{if(active)setSearchResults([]);});},320);return()=>{active=false;clearTimeout(timer);};},[query,api]);
 useEffect(()=>{if(!selected){setDetail(null);return;}let active=true;setDetail(null);setEpisode(null);setSeasonData(null);api(category(selected)+'/'+selected.id).then(d=>{if(active){setDetail(d);const first=d.seasons?.find(s=>s.season_number>0);setSeason(first?.season_number??1);}}).catch(()=>{});return()=>{active=false;};},[selected,api]);
 useEffect(()=>{if(!detail||category(detail)!=='tv')return;let active=true;api('tv/'+detail.id+'/season/'+season).then(d=>{if(active)setSeasonData(d);}).catch(()=>{if(active)setSeasonData(null);});return()=>{active=false;};},[detail,season,api]);
 useEffect(()=>{if(!genre||tab==='home'||tab==='list'||tab==='search')return;let active=true;api('discover/'+tab,{with_genres:genre,page:String(page),sort_by:'popularity.desc'}).then(d=>{if(active)setRows(old=>({...old,discovered:page===1?(d.results||[]):[...(old.discovered||[]),...(d.results||[])]}));}).catch(()=>{});return()=>{active=false;};},[genre,tab,page,api]);
 function open(item){setSelected({...item,media_type:category(item)});window.scrollTo({top:0,behavior:'smooth'});}
 function toggleList(item){
   const k=keyOf(item),exists=watchlist.some(x=>keyOf(x)===k);
   setWatchlist(old=>exists?old.filter(x=>keyOf(x)!==k):[{...item,media_type:category(item)},...old]);
   if(!session?.user?.id)localStorage.setItem('movie.watchlist',JSON.stringify(exists?watchlist.filter(x=>keyOf(x)!==k):[{...item,media_type:category(item)},...watchlist]));
   if(session?.user?.id){
     if(exists) supabase.from('user_library').delete().eq('user_id',session.user.id).eq('kind','watchlist').eq('item_key',k).then(()=>{});
     else supabase.from('user_library').upsert({user_id:session.user.id,kind:'watchlist',item_key:k,payload:{...item,media_type:category(item)}},{onConflict:'user_id,item_key,kind'}).then(()=>{});
   }
 }
 function play(item,s=1,e=1){
   const type=category(item),entry={...item,media_type:type,season:s,episode:e,watchedAt:Date.now()};
   setHistory(old=>[entry,...old.filter(x=>keyOf(x)!==keyOf(entry))].slice(0,25));
   if(!session?.user?.id)localStorage.setItem('movie.history',JSON.stringify([entry,...history.filter(x=>keyOf(x)!==keyOf(entry))].slice(0,25)));
   if(session?.user?.id) supabase.from('user_library').upsert({user_id:session.user.id,kind:'history',item_key:keyOf(entry),payload:entry},{onConflict:'user_id,item_key,kind'}).then(()=>{});
   setEpisode({type,id:item.id,season:s,number:e});
 }
 const nav=(next)=>{setTab(next);setQuery('');setGenre('');setPage(1);setSelected(null);setEpisode(null);window.scrollTo(0,0);};
 const results=query.trim()?searchResults:tab==='list'?watchlist:tab==='movie'?genre?rows.discovered:rows.movies:tab==='tv'?genre?rows.discovered:rows.shows:[];
 const activeGenres=genres[tab]||[];
 const title=(item)=>rtl?(item.title||item.name):(item.title||item.name);
 function tile(item,index){return <button className="tile" key={item.id+'-'+index} onClick={()=>open(item)} aria-label={title(item)}>
  {poster(item.poster_path)?<img loading="lazy" src={poster(item.poster_path)} alt="" />:<div className="no-poster">{title(item)}</div>}
  <div className="tile-overlay"><strong>{title(item)}</strong><span>★ {item.vote_average?.toFixed?.(1)||'–'} · {(item.release_date||item.first_air_date||'').slice(0,4)}</span></div>
 </button>;}
 function shelf(label,items,id=''){if(!items?.length)return null;return <section id={id} className="shelf"><h2>{label}</h2><div className="strip">{items.filter(i=>i.poster_path).slice(0,18).map(tile)}</div></section>;}
 const pinned=[...(siteSettings.homepage?.featured_movie_ids||[]),...(siteSettings.homepage?.featured_tv_ids||[])];
 const hero=(rows.trending||[]).find(x=>pinned.includes(x.id)&&x.backdrop_path)||(rows.trending||[]).find(x=>x.backdrop_path && (x.media_type==='movie'||x.media_type==='tv'));
 return <main dir={rtl?'rtl':'ltr'}>
 <header className="topbar"><button className="brand" onClick={()=>nav('home')}>MOVIE<span>.</span></button><nav className="main-nav"><button className={tab==='home'?'active':''} onClick={()=>nav('home')}>{t.home}</button><button className={tab==='movie'?'active':''} onClick={()=>nav('movie')}>{t.movies}</button><button className={tab==='tv'?'active':''} onClick={()=>nav('tv')}>{t.tv}</button><button className={tab==='list'?'active':''} onClick={()=>nav('list')}>{t.myList}</button></nav><div className="nav-actions"><div className="searchbox"><Search size={17}/><input aria-label={t.search} value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);}} placeholder={t.search}/>{query&&<button aria-label={t.close} onClick={()=>setQuery('')}><X size={16}/></button>}</div><button className="account-button" onClick={()=>setAccountOpen(true)}>{session?.user?.email?session.user.email.split('@')[0]:t.account}</button><button className="language" onClick={()=>setLanguage(x=>x==='en'?'ar':'en')} aria-label="Change language"><Globe2 size={18}/><span>{language==='en'?'العربية':'English'}</span></button></div></header>
 {error&&<div className="error">{t.unavailable} <small>{error}</small></div>}
 {busy&&<p className="loading">{t.loading}</p>}
 {!busy&&!selected&&!query.trim()&&tab==='home'&&<>
 {hero&&<section className="hero" style={{backgroundImage:'linear-gradient(90deg,rgba(8,9,13,.96),rgba(8,9,13,.45) 60%,rgba(8,9,13,.25)),linear-gradient(0deg,#08090d,transparent 35%),url('+poster(hero.backdrop_path,'original')+')'}}><div className="hero-content"><span className="eyebrow">{t.trending}</span><h1>{title(hero)}</h1><p>{hero.overview?.slice(0,230)}{hero.overview?.length>230?'…':''}</p><div className="hero-buttons"><button className="primary" onClick={()=>{open(hero);if(category(hero)==='movie')play(hero);}}><Play size={19} fill="currentColor"/>{t.watch}</button><button className="secondary" onClick={()=>open(hero)}>{t.details}</button></div></div></section>}
 <div className="content home-rows">
 <div className="quick-categories">
   {[['all',t.trending],['netflix',t.netflix],['prime',t.prime],['disney',t.disney]].map(([id,label])=><button key={id} onClick={()=>document.getElementById('row-'+id)?.scrollIntoView({behavior:'smooth',block:'start'})}>{label}</button>)}
 </div>
 {history.length>0&&shelf(t.continue,history)}
 {shelf(t.trending,rows.trending,'row-all')}
 {shelf(t.netflix,rows.netflix,'row-netflix')}
 {shelf(t.prime,rows.prime,'row-prime')}
 {shelf(t.disney,rows.disney,'row-disney')}
 {shelf(t.popularMovies,rows.movies)}
 {shelf(t.popularShows,rows.shows)}
 {shelf(t.topMovies,rows.topMovies)}
 {shelf(t.topShows,rows.topShows)}
 {shelf(t.nowPlaying,rows.now)}
 {shelf(t.onAir,rows.air)}
 </div></>}
 {!selected&&(query.trim()||tab!=='home')&&<section className="content results-page"><div className="results-head"><h1>{query.trim()?t.searchResults:tab==='list'?t.myList:tab==='movie'?t.movies:t.tv}</h1>{!query.trim()&&(tab==='movie'||tab==='tv')&&<div className="genre-select"><select value={genre} onChange={e=>{setGenre(e.target.value);setPage(1);}}><option value="">{t.allGenres}</option>{activeGenres.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><ChevronDown size={17}/></div>}</div>
 {tab==='list'&&!query.trim()&&history.length>0&&shelf(t.continue,history)}
 <div className="poster-grid">{results.filter(x=>x.poster_path).map(tile)}</div>
 {!results.length&&!busy&&<p className="empty">{tab==='list'&&!query.trim()?t.emptyList:t.noResults}</p>}
 {genre&&results.length>0&&!query.trim()&&<button className="more" onClick={()=>setPage(x=>x+1)}>{t.more}</button>}
 </section>}
 {selected&&<section className="detail-page"><button className="back" onClick={()=>{setSelected(null);setEpisode(null);}}>{rtl?<ArrowRight size={18}/>:<ArrowLeft size={18}/>} {t.back}</button>
 <div className="detail-hero" style={{backgroundImage:detail?.backdrop_path?'linear-gradient(0deg,#08090d 0%,rgba(8,9,13,.25) 90%),url('+poster(detail.backdrop_path,'original')+')':undefined}}/>
 <div className="detail-info"><div className="detail-poster">{detail?.poster_path&&<img src={poster(detail.poster_path)} alt=""/>}</div><div className="detail-body"><span className="eyebrow">{category(selected)==='tv'?t.tv:t.movies}</span><h1>{detail?.title||detail?.name||title(selected)}</h1><p className="facts"><Star size={17} fill="#ffc04d" color="#ffc04d"/> {detail?.vote_average?.toFixed?.(1)||'–'} · {(detail?.release_date||detail?.first_air_date||'').slice(0,4)} · {detail?.genres?.map(g=>g.name).join(' / ')}</p><p className="synopsis">{detail?.overview||t.noOverview}</p><div className="actions"><button className="primary" onClick={()=>play(selected,season,1)}><Play size={18} fill="currentColor"/> {t.watch}</button><button className="secondary" onClick={()=>toggleList(selected)}>{watchlist.some(x=>keyOf(x)===keyOf(selected))?<Check size={19}/>:<Plus size={19}/>} {watchlist.some(x=>keyOf(x)===keyOf(selected))?t.remove:t.add}</button></div></div></div>
 {category(selected)==='tv'&&<div className="season-area"><div className="results-head"><h2>{t.episodes}</h2><div className="genre-select"><select value={season} onChange={e=>{setSeason(Number(e.target.value));setEpisode(null);}}>{(detail?.seasons||[]).filter(s=>s.season_number>0).map(s=><option key={s.id} value={s.season_number}>{s.name}</option>)}</select><ChevronDown size={16}/></div></div><div className="episode-list">{(seasonData?.episodes||[]).map(ep=><button className="episode-card" key={ep.id} onClick={()=>play(selected,season,ep.episode_number)}>{ep.still_path?<img loading="lazy" src={poster(ep.still_path,'w300')} alt=""/>:<div className="still-placeholder"><Tv/></div>}<div><h3>{ep.episode_number}. {ep.name}</h3><p>{ep.overview?.slice(0,180)||t.noOverview}</p><small>{ep.runtime?ep.runtime+' min':''}</small></div><Play size={20}/></button>)}</div></div>}
 {episode&&<div className="player-shade" role="dialog" aria-modal="true" aria-label={t.watch}><div className="player-box"><div className="player-header"><strong>{title(selected)} {episode.type==='tv'?' · S'+episode.season+' E'+episode.number:''}</strong><button onClick={()=>setEpisode(null)} aria-label={t.close}><X size={23}/></button></div><div className="video-wrap"><iframe key={episode.type+episode.id+episode.season+episode.number} src={episode.type==='movie'?'https://urplayer.net/embed/movie/'+episode.id:'https://urplayer.net/embed/tv/'+episode.id+'/'+episode.season+'/'+episode.number} title="URPlayer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" referrerPolicy="no-referrer"/></div><p>{t.playerNotice}</p></div></div>}
 </section>}
 {accountOpen&&<AccountPanel language={language} session={session} onClose={()=>setAccountOpen(false)}/>}
 <footer><span>{t.tmdb}</span><a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">TMDB</a><span> · </span><a href="https://urplayer.net" target="_blank" rel="noopener noreferrer">URPlayer</a></footer>
 </main>;
}
