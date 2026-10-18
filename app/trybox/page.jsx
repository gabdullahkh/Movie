'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function TryBoxPage() {
  const [kind, setKind] = useState('movie');
  const [id, setId] = useState('1058424');
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [active, setActive] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [frameVersion, setFrameVersion] = useState(0);
  const [loginMessage, setLoginMessage] = useState('');
  const loginPopup = useRef(null);
  const loginStarted = useRef(false);
  function reloadPlayer() {
    setLoaded(false);
    setFrameVersion(v => v + 1);
  }
  function openLogin() {
    const popup = window.open('https://trybox.app/', 'trybox-signin', 'popup=yes,width=980,height=740,resizable=yes,scrollbars=yes');
    if (!popup) { setLoginMessage('Popup blocked. Allow popups for this site and try again.'); return; }
    loginPopup.current = popup;
    loginStarted.current = true;
    setLoginMessage('Sign in to TryBox in the popup, then return here. The player will reload; account access inside the iframe is not guaranteed.');
    popup.focus();
  }
  useEffect(() => {
    const backFromLogin = () => {
      if (!loginStarted.current) return;
      loginStarted.current = false;
      reloadPlayer();
      setLoginMessage('Player reloaded. If you are still signed out, TryBox may block third-party session cookies.');
    };
    window.addEventListener('focus', backFromLogin);
    return () => window.removeEventListener('focus', backFromLogin);
  }, []);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('movie.trybox.settings') || '{}');
      if (stored.kind === 'movie' || stored.kind === 'tv') setKind(stored.kind);
      if (/^\d+$/.test(String(stored.id || ''))) setId(String(stored.id));
      if (/^\d+$/.test(String(stored.season || ''))) setSeason(String(stored.season));
      if (/^\d+$/.test(String(stored.episode || ''))) setEpisode(String(stored.episode));
    } catch {}
  }, []);
  const buildUrl = () => {
    if (!/^\d{1,12}$/.test(id) || Number(id) < 1) return null;
    if (kind === 'tv' && (!/^\d{1,3}$/.test(season) || !/^\d{1,3}$/.test(episode) || Number(season) < 1 || Number(episode) < 1)) return null;
    return kind === 'movie' ? 'https://trybox.app/movie/' + id + '/play' :
      'https://trybox.app/tv/' + id + '/season/' + season + '/episode/' + episode + '/play';
  };
  const inputStyle = { width: '100%', background: '#202229', border: '1px solid #4a4b52', color: '#fff', borderRadius: 7, padding: '12px' };
  function start(event) {
    event.preventDefault();
    const next = buildUrl();
    if (!next) return;
    setLoaded(false);
    setActive(next);
    setFrameVersion(v => v + 1);
    localStorage.setItem('movie.trybox.settings', JSON.stringify({ kind, id, season, episode }));
  }
  return <main style={{minHeight:'100vh',padding:'28px max(4%, 18px)',background:'#090a0e',color:'#f6f6f7'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:15,flexWrap:'wrap',marginBottom:28}}>
      <div><h1 style={{margin:'0 0 8px',fontSize:29}}>TryBox <span style={{color:'#ef777f',fontSize:13}}>Experimental player</span></h1><p style={{color:'#adb0bc',margin:0}}>Separate from Movie and URPlayer.</p></div>
      <Link href="/" style={{color:'white',textDecoration:'none',background:'#2b2d34',borderRadius:7,padding:'12px 16px'}}>← Back to Movie</Link>
    </header>
    <form onSubmit={start} style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'end',padding:18,background:'#17191f',border:'1px solid #343640',borderRadius:12}}>
      <label style={{display:'grid',gap:8,flex:'1 1 140px'}}>Content type<select style={inputStyle} value={kind} onChange={e=>setKind(e.target.value)}><option value="movie">Movie</option><option value="tv">TV show</option></select></label>
      <label style={{display:'grid',gap:8,flex:'2 1 190px'}}>TMDB ID<input style={inputStyle} required min="1" type="number" value={id} onChange={e=>setId(e.target.value)} /></label>
      {kind === 'tv' && <>
        <label style={{display:'grid',gap:8,flex:'1 1 100px'}}>Season<input style={inputStyle} required min="1" type="number" value={season} onChange={e=>setSeason(e.target.value)}/></label>
        <label style={{display:'grid',gap:8,flex:'1 1 100px'}}>Episode<input style={inputStyle} required min="1" type="number" value={episode} onChange={e=>setEpisode(e.target.value)}/></label>
      </>}
      <button type="submit" style={{background:'#e50914',border:0,color:'#fff',fontWeight:700,borderRadius:7,padding:'13px 24px'}}>Open player</button>
    </form>
    {active && <section style={{marginTop:24,maxWidth:1150}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:12}}>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}><strong>TryBox player</strong><button type="button" onClick={openLogin} style={{color:'white',background:'#b91c27',border:0,padding:'10px 15px',borderRadius:7,cursor:'pointer'}}>Sign in with Google (popup)</button><button type="button" onClick={reloadPlayer} style={{color:'white',background:'#32343e',border:0,padding:'10px 15px',borderRadius:7,cursor:'pointer'}}>Reload player</button></div>
        <a href={active} target="_blank" rel="noreferrer" style={{color:'white',textDecoration:'none',background:'#2e313b',padding:'10px 15px',borderRadius:7}}>Open directly ↗</a>
      </div>
      {loginMessage && <p role="status" style={{color:'#c9ced7',fontSize:13}}>{loginMessage}</p>}
      <div style={{width:'100%',aspectRatio:'16 / 9',background:'#000',borderRadius:10,overflow:'hidden',border:'1px solid #383b44'}}>
        <iframe key={active + ':' + frameVersion} src={active} title="TryBox player" onLoad={()=>setLoaded(true)} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={{width:'100%',height:'100%',border:0}} />
      </div>
      <p style={{color:'#aeb0b9',fontSize:13,lineHeight:1.6}}>The popup opens TryBox's own website; Google sign-in is handled by TryBox. Browser privacy rules or TryBox's cookie settings may prevent that login from carrying into the embedded player. {loaded ? 'Page load event received; playback is not independently verified.' : ''}</p>
    </section>}
  </main>;
}
