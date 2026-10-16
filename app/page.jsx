'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import AccountPanel from '../components/AccountPanel';
import { supabase } from '../lib/supabase';
import { Search, Play, Plus, Check, X, Globe2, Bookmark, Clapperboard, Tv, Home, ArrowLeft, ArrowRight, Star, ChevronDown } from 'lucide-react';

const IMAGE='https://image.tmdb.org/t/p/';
const poster=(path,size='w500')=>path?IMAGE+size+path:null;
const category=(x)=>x.media_type==='tv'||(!x.media_type && (x.first_air_date!==undefined || x.name!==undefined))?'tv':'movie';
const labels={
 en:{home:'Home',movies:'Movies',tv:'TV Shows',myList:'My List',search:'Search movies and TV shows',trending:'Trending this week',popularMovies:'Popular movies',popularShows:'Popular TV shows',topMovies:'Top rated movies',topShows:'Top rated TV shows',recentMovies:'Recently released movies',newEpisodes:'New episodes airing',nextEpisode:'Next Episode',netflix:'Latest on Netflix',prime:'Latest on Prime Video',account:'Account',onAir:'Currently airing',nowPlaying:'Now playing',watch:'Watch Now',details:'More Info',add:'My List',remove:'Remove from list',seasons:'Seasons',episodes:'Episodes',episode:'Episode',continue:'Continue watching',back:'Back',allGenres:'All Genres',noResults:'No titles found.',emptyList:'Your list is empty. Add movies or shows to save them here.',loading:'Loading...',rating:'Rating',overview:'Overview',noOverview:'No description available.',unavailable:'Unable to load titles. Check TMDB API configuration.',playerNotice:'Playback is provided by a third-party website. Ads and external redirects are outside our control.',tmdb:'This product uses the TMDB API but is not endorsed or certified by TMDB.',close:'Close',searchResults:'Search results',browse:'Browse',selectEpisode:'Select an episode',more:'Show more',backHome:'Back to home'},
 ar:{home:'الرئيسية',movies:'أفلام',tv:'مسلسلات',myList:'قائمتي',search:'ابحث عن أفلام ومسلسلات',trending:'الرائج هذا الأسبوع',popularMovies:'أفلام شائعة',popularShows:'مسلسلات شائعة',topMovies:'أعلى الأفلام تقييماً',topShows:'أعلى المسلسلات تقييماً',recentMovies:'أحدث الأفلام إصداراً',newEpisodes:'مسلسلات بحلقات جديدة',nextEpisode:'الحلقة التالية',netflix:'الأحدث على نتفليكس',prime:'الأحدث على برايم فيديو',account:'الحساب',onAir:'يعرض الآن',nowPlaying:'في السينما',watch:'شاهد الآن',details:'المزيد من التفاصيل',add:'إضافة إلى قائمتي',remove:'إزالة من قائمتي',seasons:'المواسم',episodes:'الحلقات',episode:'الحلقة',continue:'متابعة المشاهدة',back:'رجوع',allGenres:'كل الأنواع',noResults:'لا توجد نتائج.',emptyList:'قائمتك فارغة. أضف أفلاماً أو مسلسلات لحفظها هنا.',loading:'جاري التحميل...',rating:'التقييم',overview:'القصة',noOverview:'لا يوجد وصف متوفر.',unavailable:'تعذر تحميل البيانات. تحقق من إعدادات TMDB.',playerNotice:'المشاهدة عبر مشغل خارجي. الإعلانات والتحويلات خارج تحكمنا.',tmdb:'هذا المنتج يستخدم واجهة TMDB لكنه غير معتمد أو مدعوم من TMDB.',close:'إغلاق',searchResults:'نتائج البحث',browse:'تصفح',selectEpisode:'اختر الحلقة',more:'عرض المزيد',backHome:'العودة للرئيسية'}
};
function readStorage(key,fallback){try{const d=localStorage.getItem(key);if(!d)return fallback;const parsed=JSON.parse(d);return Array.isArray(fallback)?(Array.isArray(parsed)?parsed:fallback):parsed;}catch{return fallback;}}
const keyOf=(item)=>item&&typeof item==='object'?category(item)+':'+item.id:'invalid';
const sections={
 trending:{path:'trending/all/week'},
 netflix:{provider:8},
 prime:{provider:119},
 movies:{path:'movie/popular',type:'movie'},
 shows:{path:'tv/popular',type:'tv'},
 topMovies:{path:'movie/top_rated',type:'movie'},
 topShows:{path:'tv/top_rated',type:'tv'},
 now:{path:'movie/now_playing',type:'movie'},
 air:{path:'tv/on_the_air',type:'tv'},
 recentMovies:{path:'discover/movie',type:'movie',recent:true},
 newEpisodes:{path:'tv/airing_today',type:'tv'}
};
export default function Page(){
 const [language,setLanguage]=useState('en');
 const t=labels[language],rtl=language==='ar';
 const [tab,setTab]=useState('home'),[query,setQuery]=useState(''),[searchResults,setSearchResults]=useState([]),[searchLoading,setSearchLoading]=useState(false),[searchError,setSearchError]=useState('');
 const [rows,setRows]=useState({}),[genres,setGenres]=useState({movie:[],tv:[]}),[genre,setGenre]=useState('');
 const [selected,setSelected]=useState(null),[detail,setDetail]=useState(null),[season,setSeason]=useState(1),[seasonData,setSeasonData]=useState(null),[episode,setEpisode]=useState(null);
 const [watchlist,setWatchlist]=useState([]),[history,setHistory]=useState([]),[siteSettings,setSiteSettings]=useState({}),[busy,setBusy]=useState(true),[error,setError]=useState(''),[page,setPage]=useState(1);
 const [session,setSession]=useState(null),[accountOpen,setAccountOpen]=useState(false),[authLoaded,setAuthLoaded]=useState(false);
 const [profiles,setProfiles]=useState([]),[activeProfileId,setActiveProfileId]=useState(null),[libraryReady,setLibraryReady]=useState(false);
 const [feedItems,setFeedItems]=useState([]),[feedPage,setFeedPage]=useState(1),[feedLoading,setFeedLoading]=useState(false),[feedMore,setFeedMore]=useState(true);
 const scrollAnchor=useRef(null);
 const resumeRef=useRef(null);
 const [appIssue,setAppIssue]=useState('');
 const api=useCallback(async(path,params={})=>{const u=new URLSearchParams({path,language:language==='ar'?'ar-SA':'en-US',...params});const r=await fetch('/api/tmdb?'+u);const json=await r.json();if(!r.ok)throw Error(json.error||'Unable to fetch');return json;},[language]);
 useEffect(()=>{setWatchlist(readStorage('movie.watchlist',[]));setHistory(readStorage('movie.history',[]));setLanguage(readStorage('movie.language','en')==='ar'?'ar':'en');fetch('/api/settings').then(r=>r.json()).then(d=>setSiteSettings(d.settings||{})).catch(()=>{});},[]);
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
     setProfiles([]);setActiveProfileId(null);setLibraryReady(true);
     setWatchlist(readStorage('movie.watchlist',[]));setHistory(readStorage('movie.history',[]));
     return;
   }
   let alive=true;const uid=session.user.id;
   setLibraryReady(false);setProfiles([]);setActiveProfileId(null);setHistory([]);setWatchlist([]);
   (async()=>{
     try{
       const {data:existing,error:err}=await supabase.from('movie_profiles').select('id,name').eq('user_id',uid).order('created_at');
       if(err)throw err;
       let list=existing||[];
       if(!list.length){
         const {data:created,error:createError}=await supabase.from('movie_profiles').insert({user_id:uid,name:'Main'}).select('id,name').single();
         if(createError)throw createError;
         list=[created];
         const {data:legacy}=await supabase.from('user_library').select('item_key,kind,payload').eq('user_id',uid);
         if(legacy?.length) await supabase.from('movie_profile_library').upsert(legacy.map(x=>({profile_id:created.id,item_key:x.item_key,kind:x.kind,payload:x.payload})),{onConflict:'profile_id,item_key,kind'});
       }
       if(alive){
         setProfiles(list);
         const saved=localStorage.getItem('movie.activeProfile.'+uid);
         setActiveProfileId(list.some(p=>p.id===saved)?saved:list[0].id);
       }
     }catch(err){if(alive){setAppIssue(err.message||'Unable to load family profiles');setLibraryReady(false);}}
   })();
   return()=>{alive=false;};
 },[authLoaded,session?.user?.id]);
 useEffect(()=>{
   if(!session?.user?.id||!activeProfileId)return;
   let alive=true;setLibraryReady(false);setHistory([]);setWatchlist([]);
   localStorage.setItem('movie.activeProfile.'+session.user.id,activeProfileId);
   (async()=>{
     const {data,error}=await supabase.from('movie_profile_library').select('kind,payload').eq('profile_id',activeProfileId);
     if(!alive)return;
     if(error){setAppIssue(error.message);return;}
     const items=data||[];
     setWatchlist(items.filter(x=>x.kind==='watchlist').map(x=>x.payload));
     setHistory(items.filter(x=>x.kind==='history').map(x=>x.payload).sort((a,b)=>(b.watchedAt||0)-(a.watchedAt||0)));
     setLibraryReady(true);
   })();
   return()=>{alive=false;};
 },[activeProfileId,session?.user?.id]);
 async function addProfile(name){
   if(!session?.user?.id)throw Error('Sign in first');
   if(profiles.length>=8)throw Error('Maximum eight profiles');
   const {data,error}=await supabase.from('movie_profiles').insert({user_id:session.user.id,name}).select('id,name').single();
   if(error)throw error;
   setProfiles(old=>[...old,data]);setActiveProfileId(data.id);
 }
 useEffect(()=>{let alive=true;setBusy(true);setError('');const endpoints={trending:'trending/all/week',movies:'movie/popular',shows:'tv/popular',topMovies:'movie/top_rated',topShows:'tv/top_rated',now:'movie/now_playing',air:'tv/on_the_air',newEpisodes:'tv/airing_today'};
 const providers={netflix:8,prime:119};
 const since=new Date(Date.now()-540*86400000).toISOString().slice(0,10);
 const today=new Date().toISOString().slice(0,10);
 const newFrom=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
 Promise.all([...Object.entries(endpoints).map(async ([key,path])=>[key,(await api(path)).results||[]]),...['movie','tv'].map(async type=>['genre_'+type,(await api('genre/'+type+'/list')).genres||[]]),
  (async()=>{
    try{
      const data=await api('discover/movie',{sort_by:'primary_release_date.desc','primary_release_date.gte':newFrom,'primary_release_date.lte':today});
      return ['newMovies',(data.results||[]).map(x=>({...x,media_type:'movie'}))];
    }catch{return ['newMovies',[]];}
  })(),
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
 useEffect(()=>{
   const text=query.trim();
   if(!text){setSearchResults([]);setSearchLoading(false);setSearchError('');return;}
   let active=true;
   setSearchLoading(true);
   setSearchError('');
   setSearchResults([]);
   const timer=setTimeout(()=>{
     api('search/multi',{query:text}).then(data=>{
       if(active)setSearchResults(Array.isArray(data.results)?data.results.filter(v=>v&&(v.media_type==='movie'||v.media_type==='tv')):[]);
     }).catch(err=>{if(active){setSearchError(err.message||'Search failed');setSearchResults([]);}})
       .finally(()=>{if(active)setSearchLoading(false);});
   },250);
   return()=>{active=false;clearTimeout(timer);};
 },[query,api]);
 useEffect(()=>{if(!selected){setDetail(null);return;}let active=true;setDetail(null);setEpisode(null);setSeasonData(null);api(category(selected)+'/'+selected.id).then(d=>{if(active){setDetail(d);const first=d.seasons?.find(s=>s.season_number>0);setSeason(first?.season_number??1);}}).catch(()=>{});return()=>{active=false;};},[selected,api]);
 useEffect(()=>{if(!detail||category(detail)!=='tv')return;let active=true;api('tv/'+detail.id+'/season/'+season).then(d=>{if(active)setSeasonData(d);}).catch(()=>{if(active)setSeasonData(null);});return()=>{active=false;};},[detail,season,api]);
 useEffect(()=>{
   setFeedItems([]);
   setFeedPage(1);
   setFeedMore(true);
 },[tab,genre,language,Boolean(query.trim())]);
 useEffect(()=>{
   if((feedPage<=1&&!tab.startsWith('section:')&&!(genre&&(tab==='movie'||tab==='tv')))||query.trim()||tab==='list')return;
   let active=true;
   setFeedLoading(true);
   const params={page:String(feedPage),sort_by:'popularity.desc'};
   if(genre&&(tab==='movie'||tab==='tv'))params.with_genres=genre;
   const section=tab.startsWith('section:')?sections[tab.slice(8)]:null;
   const get=section
     ?section.provider
       ?Promise.all(['movie','tv'].map(type=>api('discover/'+type,{
           page:String(feedPage),watch_region:'SA',
           with_watch_providers:String(section.provider),with_watch_monetization_types:'flatrate',...(genre?{with_genres:genre}:{}),
           sort_by:'popularity.desc'
         }).then(d=>(d.results||[]).map(x=>({...x,media_type:type})))))
         .then(groups=>groups.flat())
       :genre
         ?(section.type?api('discover/'+section.type,{...params,with_genres:genre} ).then(d=>(d.results||[]).map(x=>({...x,media_type:section.type}))):
          Promise.all(['movie','tv'].map(type=>api('discover/'+type,{...params,with_genres:genre}).then(d=>(d.results||[]).map(x=>({...x,media_type:type}))))).then(groups=>groups.flat()))
         :api(section.path,section.recent?{page:String(feedPage),sort_by:'primary_release_date.desc','primary_release_date.gte':new Date(Date.now()-90*86400000).toISOString().slice(0,10),'primary_release_date.lte':new Date().toISOString().slice(0,10)}:{page:String(feedPage)}).then(d=>(d.results||[]).map(x=>({...x,media_type:section.type||x.media_type||category(x)})))
     :tab==='home'
       ?Promise.all([api('discover/movie',params),api('discover/tv',params)]).then(([movies,shows])=>[
          ...(movies.results||[]).map(x=>({...x,media_type:'movie'})),
          ...(shows.results||[]).map(x=>({...x,media_type:'tv'}))
        ])
       :api('discover/'+tab,params).then(d=>(d.results||[]).map(x=>({...x,media_type:tab})));
   get.then(items=>{
     if(!active)return;
     setFeedItems(old=>{
       const keys=new Set(old.map(keyOf));
       return [...old,...items.filter(x=>{const k=keyOf(x);if(keys.has(k))return false;keys.add(k);return true;})];
     });
     if(items.length===0||feedPage>=100)setFeedMore(false);
   }).catch(err=>{if(active){setFeedMore(false);setAppIssue(err.message||'More titles could not be loaded');}})
   .finally(()=>{if(active)setFeedLoading(false);});
   return()=>{active=false;};
 },[feedPage,tab,genre,language,query,api]);
 useEffect(()=>{
   const node=scrollAnchor.current;
   if(!node||feedLoading||!feedMore||busy||Boolean(selected)||Boolean(query.trim())||tab==='list')return;
   const observer=new IntersectionObserver(entries=>{
     if(entries[0]?.isIntersecting)setFeedPage(p=>p+1);
   },{rootMargin:'600px'});
   observer.observe(node);
   return()=>observer.disconnect();
 },[feedLoading,feedMore,busy,selected,query,tab,feedPage]);
 function enterFullscreen(){
   try{
     const root=document.documentElement;
     if(root.requestFullscreen&&!document.fullscreenElement){
       const promise=root.requestFullscreen({navigationUI:'hide'});
       if(promise?.catch)promise.catch(()=>{});
     }
   }catch{}
 }
 function open(item){
   if(!item?.id)return;
   // Opening a title never launches playback. Only Watch buttons call play().
   if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
   setEpisode(null);
   resumeRef.current=item.watchedAt?item:null;
   setSelected({...item,media_type:category(item)});
   window.scrollTo({top:0,behavior:'smooth'});
 }
 function resumeWatching(item){
   if(!item||!item.id)return;
   const type=category(item);
   enterFullscreen();
   resumeRef.current={type,id:item.id,season:Number(item.season)||1,number:Number(item.episode)||1};
   setSelected({...item,media_type:type});
   window.scrollTo({top:0,behavior:'smooth'});
 }
 function toggleList(item){
   if(session?.user?.id&&!libraryReady)return;
   const k=keyOf(item),exists=watchlist.some(x=>keyOf(x)===k);
   setWatchlist(old=>exists?old.filter(x=>keyOf(x)!==k):[{...item,media_type:category(item)},...old]);
   if(!session?.user?.id)localStorage.setItem('movie.watchlist',JSON.stringify(exists?watchlist.filter(x=>keyOf(x)!==k):[{...item,media_type:category(item)},...watchlist]));
   if(session?.user?.id&&activeProfileId&&libraryReady){
     if(exists) supabase.from('movie_profile_library').delete().eq('profile_id',activeProfileId).eq('kind','watchlist').eq('item_key',k).then(()=>{});
     else supabase.from('movie_profile_library').upsert({profile_id:activeProfileId,kind:'watchlist',item_key:k,payload:{...item,media_type:category(item)}},{onConflict:'profile_id,item_key,kind'}).then(()=>{});
   }
 }
 function nextEpisode(){
   if(!episode||episode.type!=='tv'||!selected)return;
   const available=seasonData?.episodes||[];
   const next=available.find(ep=>ep.episode_number===episode.number+1);
   if(next&&(!next.air_date||next.air_date<=new Date().toISOString().slice(0,10))){
     play(selected,episode.season,next.episode_number);
     return;
   }
   const nextSeason=(detail?.seasons||[]).filter(s=>s.season_number>episode.season&&s.episode_count>0).sort((a,b)=>a.season_number-b.season_number)[0];
   if(!nextSeason){setAppIssue(rtl?'لا توجد حلقة تالية متاحة':'No next released episode available');return;}
   api('tv/'+selected.id+'/season/'+nextSeason.season_number).then(d=>{
     const first=(d.episodes||[]).find(x=>!x.air_date||x.air_date<=new Date().toISOString().slice(0,10));
     if(first){setSeason(nextSeason.season_number);setSeasonData(d);play(selected,nextSeason.season_number,first.episode_number);}
     else setAppIssue(rtl?'الحلقة القادمة لم تصدر بعد':'Next episode is not released yet');
   }).catch(()=>setAppIssue(rtl?'تعذر تحميل الحلقة التالية':'Could not load next episode'));
 }
 function play(item,s=1,e=1){
   if(session?.user?.id&&!libraryReady)return;
   enterFullscreen();
   const type=category(item),entry={...item,media_type:type,season:s,episode:e,watchedAt:Date.now()};
   setHistory(old=>[entry,...old.filter(x=>keyOf(x)!==keyOf(entry))].slice(0,25));
   if(!session?.user?.id)localStorage.setItem('movie.history',JSON.stringify([entry,...history.filter(x=>keyOf(x)!==keyOf(entry))].slice(0,25)));
   if(session?.user?.id&&activeProfileId&&libraryReady) supabase.from('movie_profile_library').upsert({profile_id:activeProfileId,kind:'history',item_key:keyOf(entry),payload:entry},{onConflict:'profile_id,item_key,kind'}).then(()=>{});
   setEpisode({type,id:item.id,season:s,number:e});
 }
 const nav=(next)=>{setTab(next);setQuery('');setGenre('');setPage(1);setSelected(null);setEpisode(null);window.scrollTo(0,0);};
 const results=query.trim()?searchResults:tab==='list'?watchlist:tab==='movie'?(genre?[]:(rows.movies||[])):tab==='tv'?(genre?[]:(rows.shows||[])):[];
 const activeGenres=tab.startsWith('section:')?[...new Map([...(genres.movie||[]),...(genres.tv||[])].map(g=>[g.id,g])).values()].sort((a,b)=>a.name.localeCompare(b.name)):(genres[tab]||[]);
 const lastPlayed=selected?(history.find(item=>item&&keyOf(item)===keyOf(selected))||(resumeRef.current&&keyOf(resumeRef.current)===keyOf(selected)?resumeRef.current:null)):null;
 const title=(item)=>rtl?(item.title||item.name):(item.title||item.name);
 function tile(item,index){return <button className="tile" key={item.id+'-'+index} onClick={()=>open(item)} aria-label={title(item)+(query.trim()?' — '+(category(item)==='tv'?t.tv:t.movies):'')}>
  {poster(item.poster_path)?<img loading="lazy" src={poster(item.poster_path)} alt="" />:<div className="no-poster">{title(item)}</div>}
  {query.trim()&&<span className="search-type-label">{category(item)==='tv'?(rtl?'مسلسل':'TV Show'):(rtl?'فيلم':'Movie')}</span>}
   <div className="tile-overlay"><strong>{title(item)}</strong><span>★ {item.vote_average?.toFixed?.(1)||'–'} · {(item.release_date||item.first_air_date||'').slice(0,4)}</span></div>
 </button>;}
 function shelf(label,items,id='',sectionKey=''){if(!items?.length)return null;const isContinue=sectionKey==='continue';return <section id={id} className="shelf"><h2>{isContinue?label:<button className="shelf-heading" onClick={()=>nav('section:'+(sectionKey||id.replace('row-','')))}>{label} <span aria-hidden="true">›</span></button>}</h2><div className="strip">{items.filter(i=>i&&i.poster_path).slice(0,18).map((item,i)=>isContinue?<button className="tile resume-tile" key={'resume-'+keyOf(item)} onClick={()=>{setEpisode(null);open(item);}} aria-label={(item.title||item.name||'')+' — '+t.details}><img loading="lazy" src={poster(item.poster_path)} alt=""/><span className="resume-label">{category(item)==='tv'?('S'+(item.season||1)+' · E'+(item.episode||1)):(rtl?'متابعة الفيلم':'Continue movie')} <ArrowRight size={15}/></span></button>:tile(item,i))}</div></section>;}
 const pinned=[...(siteSettings.homepage?.featured_movie_ids||[]),...(siteSettings.homepage?.featured_tv_ids||[])];
 const hero=(rows.trending||[]).find(x=>pinned.includes(x.id)&&x.backdrop_path)||(rows.trending||[]).find(x=>x.backdrop_path && (x.media_type==='movie'||x.media_type==='tv'));
 return <main dir={rtl?'rtl':'ltr'}>
 <header className="topbar"><button className="brand" onClick={()=>nav('home')}>MOVIE<span>.</span></button><nav className="main-nav"><button className={tab==='home'?'active':''} onClick={()=>nav('home')}>{t.home}</button><button className={tab==='movie'?'active':''} onClick={()=>nav('movie')}>{t.movies}</button><button className={tab==='tv'?'active':''} onClick={()=>nav('tv')}>{t.tv}</button><button className={tab==='list'?'active':''} onClick={()=>nav('list')}>{t.myList}</button></nav><div className="nav-actions"><div className="searchbox"><Search size={17}/><input aria-label={t.search} value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);}} placeholder={t.search}/>{query&&<button aria-label={t.close} onClick={()=>setQuery('')}><X size={16}/></button>}</div><button className="account-button" onClick={()=>setAccountOpen(true)}>{session?.user?.email?(profiles.find(p=>p.id===activeProfileId)?.name||session.user.email.split('@')[0]):t.account}</button><button className="language" onClick={()=>setLanguage(x=>x==='en'?'ar':'en')} aria-label="Change language"><Globe2 size={18}/><span>{language==='en'?'العربية':'English'}</span></button></div></header>
 {error&&<div className="error">{t.unavailable} <small>{error}</small></div>}
 {appIssue&&<div className="error" role="alert">{appIssue}</div>}
 {busy&&!query.trim()&&<p className="loading">{t.loading}</p>}
 {!busy&&!selected&&!query.trim()&&tab==='home'&&<>
 {hero&&<section className="hero" style={{backgroundImage:'linear-gradient(90deg,rgba(8,9,13,.96),rgba(8,9,13,.45) 60%,rgba(8,9,13,.25)),linear-gradient(0deg,#08090d,transparent 35%),url('+poster(hero.backdrop_path,'original')+')'}}><div className="hero-content"><span className="eyebrow">{t.trending}</span><h1>{title(hero)}</h1><p>{hero.overview?.slice(0,230)}{hero.overview?.length>230?'…':''}</p><div className="hero-buttons"><button className="primary" onClick={()=>{open(hero);if(category(hero)==='movie')play(hero);}}><Play size={19} fill="currentColor"/>{t.watch}</button><button className="secondary" onClick={()=>open(hero)}>{t.details}</button></div></div></section>}
 <div className="content home-rows">
 <div className="quick-categories">
   {[['all',t.trending],['netflix',t.netflix],['prime',t.prime]].map(([id,label])=><button key={id} onClick={()=>document.getElementById('row-'+id)?.scrollIntoView({behavior:'smooth',block:'start'})}>{label}</button>)}
 </div>
 {libraryReady&&history.length>0&&shelf(t.continue,history,'','continue')}
 {shelf(t.trending,rows.trending,'row-all','trending')}
 {shelf(t.recentMovies,rows.newMovies,'','recentMovies')}
 {shelf(t.newEpisodes,(rows.newEpisodes||[]).map(x=>({...x,media_type:'tv'})),'','newEpisodes')}
 {shelf(t.netflix,rows.netflix,'row-netflix','netflix')}
 {shelf(t.prime,rows.prime,'row-prime','prime')}
 {shelf(t.popularMovies,rows.movies,'','movies')}
 {shelf(t.popularShows,rows.shows,'','shows')}
 {shelf(t.topMovies,rows.topMovies,'','topMovies')}
 {shelf(t.topShows,rows.topShows,'','topShows')}
 {shelf(t.nowPlaying,rows.now,'','now')}
 {shelf(t.onAir,rows.air,'','air')}
 <section className="shelf discover-feed"><h2>{rtl?'اكتشف المزيد':'Discover more'}</h2><div className="poster-grid">{feedItems.filter(x=>x.poster_path).map(tile)}</div></section>
 {feedLoading&&<p className="loading">{t.loading}</p>}
 <div ref={tab==='home'?scrollAnchor:null} className="scroll-anchor" aria-hidden="true"/>
 </div></>}
 {!selected&&(query.trim()||tab!=='home')&&<section className="content results-page"><div className="results-head"><h1>{query.trim()?t.searchResults:tab==='list'?t.myList:tab.startsWith('section:')?( {trending:t.trending,netflix:t.netflix,prime:t.prime,recentMovies:t.recentMovies,newEpisodes:t.newEpisodes,movies:t.popularMovies,shows:t.popularShows,topMovies:t.topMovies,topShows:t.topShows,now:t.nowPlaying,air:t.onAir}[tab.slice(8)]||t.browse):tab==='movie'?t.movies:t.tv}</h1>{!query.trim()&&(tab==='movie'||tab==='tv'||tab.startsWith('section:'))&&<div className="genre-select"><select value={genre} onChange={e=>{setGenre(e.target.value);setPage(1);setFeedItems([]);setFeedPage(1);setFeedMore(true);}}><option value="">{t.allGenres}</option>{activeGenres.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><ChevronDown size={17}/></div>}</div>
 {tab.startsWith('section:')&&<button className="back" onClick={()=>nav('home')}>{rtl?<ArrowRight size={18}/>:<ArrowLeft size={18}/>} {t.backHome}</button>}
 {tab==='list'&&!query.trim()&&libraryReady&&history.length>0&&shelf(t.continue,history,'','continue')}
 <div className="poster-grid">{(tab.startsWith('section:')?feedItems:[...results,...(!query.trim()&&tab!=='list'?feedItems:[])]).filter(x=>x&&x.poster_path).map(tile)}</div>
 {searchLoading&&<p className="loading">{t.loading}</p>}
 {searchError&&<p className="error" role="alert">{searchError}</p>}
 {!query.trim()&&feedLoading&&<p className="loading">{t.loading}</p>}
 {!query.trim()&&tab!=='list'&&<div ref={scrollAnchor} className="scroll-anchor" aria-hidden="true"/>}
 {!(tab.startsWith('section:')?feedItems.length:results.length+feedItems.length)&&!busy&&!feedLoading&&!searchLoading&&!searchError&&<p className="empty">{tab==='list'&&!query.trim()?t.emptyList:t.noResults}</p>}
 
 </section>}
 {selected&&<section className="detail-page"><button className="back" onClick={()=>{setSelected(null);setEpisode(null);}}>{rtl?<ArrowRight size={18}/>:<ArrowLeft size={18}/>} {t.back}</button>
 <div className="detail-hero" style={{backgroundImage:detail?.backdrop_path?'linear-gradient(0deg,#08090d 0%,rgba(8,9,13,.25) 90%),url('+poster(detail.backdrop_path,'original')+')':undefined}}/>
 <div className="detail-info"><div className="detail-poster">{detail?.poster_path&&<img src={poster(detail.poster_path)} alt=""/>}</div><div className="detail-body"><span className="eyebrow">{category(selected)==='tv'?t.tv:t.movies}</span><h1>{detail?.title||detail?.name||title(selected)}</h1><p className="facts"><Star size={17} fill="#ffc04d" color="#ffc04d"/> {detail?.vote_average?.toFixed?.(1)||'–'} · {(detail?.release_date||detail?.first_air_date||'').slice(0,4)} · {detail?.genres?.map(g=>g.name).join(' / ')}</p><p className="synopsis">{detail?.overview||t.noOverview}</p><div className="actions">{lastPlayed&&<button className="primary" onClick={()=>play(selected,Number(lastPlayed.season)||1,Number(lastPlayed.episode)||1)}><Play size={18} fill="currentColor"/> {t.continue}{category(selected)==='tv'?' · S'+(lastPlayed.season||1)+' E'+(lastPlayed.episode||1):''}</button>}<button className={lastPlayed?'secondary':'primary'} onClick={()=>play(selected,category(selected)==='tv'?(detail?.seasons?.find(x=>x.season_number>0)?.season_number||1):1,1)}><Play size={18} fill="currentColor"/> {lastPlayed?(rtl?'ابدأ من البداية':'Start from beginning'):t.watch}</button><button className="secondary" onClick={()=>toggleList(selected)}>{watchlist.some(x=>keyOf(x)===keyOf(selected))?<Check size={19}/>:<Plus size={19}/>} {watchlist.some(x=>keyOf(x)===keyOf(selected))?t.remove:t.add}</button></div></div></div>
 {category(selected)==='tv'&&<div className="season-area"><div className="results-head"><h2>{t.episodes}</h2><div className="genre-select"><select value={season} onChange={e=>{setSeason(Number(e.target.value));setEpisode(null);}}>{(detail?.seasons||[]).filter(s=>s.season_number>0).map(s=><option key={s.id} value={s.season_number}>{s.name}</option>)}</select><ChevronDown size={16}/></div></div><div className="episode-list">{(seasonData?.episodes||[]).map(ep=><button className="episode-card" key={ep.id} onClick={()=>play(selected,season,ep.episode_number)}>{ep.still_path?<img loading="lazy" src={poster(ep.still_path,'w300')} alt=""/>:<div className="still-placeholder"><Tv/></div>}<div><h3>{ep.episode_number}. {ep.name}</h3><p>{ep.overview?.slice(0,180)||t.noOverview}</p><small>{ep.runtime?ep.runtime+' min':''}</small></div><Play size={20}/></button>)}</div></div>}
 {episode&&<div className="player-shade" role="dialog" aria-modal="true" aria-label={t.watch}><div className="player-box"><div className="player-header"><strong>{title(selected)} {episode.type==='tv'?' · S'+episode.season+' E'+episode.number:''}</strong><div className="player-tools">{episode.type==='tv'&&<button className="next-episode" onClick={nextEpisode}>{t.nextEpisode} <ArrowRight size={17}/></button>}<button onClick={()=>{setEpisode(null);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}} aria-label={t.close}><X size={23}/></button></div></div><div className="video-wrap"><iframe key={episode.type+episode.id+episode.season+episode.number} src={(episode.type==='movie'?'https://urplayer.net/embed/movie/'+episode.id:'https://urplayer.net/embed/tv/'+episode.id+'/'+episode.season+'/'+episode.number)+'?autoplay=1'} title="URPlayer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" referrerPolicy="no-referrer"/></div><p>{t.playerNotice}</p></div></div>}
 </section>}
 {accountOpen&&<AccountPanel language={language} session={session} profiles={profiles} activeProfile={profiles.find(p=>p.id===activeProfileId)} onSelectProfile={id=>{setActiveProfileId(id);setSelected(null);setEpisode(null);}} onCreateProfile={addProfile} onClose={()=>setAccountOpen(false)}/>}
 <footer><span>{t.tmdb}</span><a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">TMDB</a><span> · </span><a href="https://urplayer.net" target="_blank" rel="noopener noreferrer">URPlayer</a></footer>
 </main>;
}
