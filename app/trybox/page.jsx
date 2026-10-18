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
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [testingSession, setTestingSession] = useState(false);
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
    setLoginAttempted(true);
    setLoginMessage('Complete sign-in in the TryBox popup, then return here and test the embedded session.');
    popup.focus();
  }
  useEffect(() => {
    const backFromLogin = () => {
      if (!loginStarted.current) return;
      loginStarted.current = false;
      setLoginMessage('Returned from TryBox. Select “Test embedded session” to check whether TryBox recognizes your account inside Movie.');
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
    if (!testingSession) return;
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
    <section style={{maxWidth:960,background:'#17191f',border:'1px solid #343640',padding:24,borderRadius:12,marginBottom:20}}>
      <h2 style={{fontSize:23,margin:'0 0 10px'}}>1. Sign in to TryBox</h2>
      <p style={{color:'#c0c3cc',lineHeight:1.6}}>Sign in through TryBox's own website. Google login cannot complete inside the embedded player.</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',marginTop:16}}>
        <button type="button" onClick={openLogin} style={{background:'#e50914',color:'#fff',border:0,borderRadius:7,padding:'13px 20px',fontWeight:700,cursor:'pointer'}}>Sign in to TryBox (popup)</button>
        <button type="button" disabled={!loginAttempted} onClick={()=>{setTestingSession(true);setLoaded(false);setActive('https://trybox.app/');setFrameVersion(v=>v+1);setLoginMessage('Check the embedded page below. If it requests login again, the session is not shared and playback cannot be unlocked from Movie.');}} style={{background:loginAttempted?'#353943':'#25272d',color:loginAttempted?'white':'#888',border:0,borderRadius:7,padding:'13px 20px',cursor:loginAttempted?'pointer':'not-allowed'}}>Test embedded session</button>
      </div>
      {loginMessage&&<p role="status" style={{color:'#cdd0d8',fontSize:14,marginTop:15}}>{loginMessage}</p>}
      <p style={{fontSize:13,color:'#9da1ad',marginTop:16}}>Movie cannot read TryBox's login cookies or verify its session. This is a manual test, not a verified login.</p>
    </section>
    {testingSession&&<section style={{maxWidth:960,marginBottom:20}}>
      <h2 style={{fontSize:21}}>2. Select content</h2>
      <form onSubmit={start} style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'end',padding:18,background:'#17191f',border:'1px solid #343640',borderRadius:12}}>
      <label style={{display:'grid',gap:8,flex:'1 1 140px'}}>Content type<select style={inputStyle} value={kind} onChange={e=>setKind(e.target.value)}><option value="movie">Movie</option><option value="tv">TV show</option></select></label>
      <label style={{display:'grid',gap:8,flex:'2 1 190px'}}>TMDB ID<input style={inputStyle} required min="1" type="number" value={id} onChange={e=>setId(e.target.value)} /></label>
      {kind === 'tv' && <>
        <label style={{display:'grid',gap:8,flex:'1 1 100px'}}>Season<input style={inputStyle} required min="1" type="number" value={season} onChange={e=>setSeason(e.target.value)}/></label>
        <label style={{display:'grid',gap:8,flex:'1 1 100px'}}>Episode<input style={inputStyle} required min="1" type="number" value={episode} onChange={e=>setEpisode(e.target.value)}/></label>
      </>}
      <button type="submit" disabled={!testingSession} style={{background:'#e50914',border:0,color:'#fff',fontWeight:700,borderRadius:7,padding:'13px 24px'}}>Open player</button>
      </form>
    </section>}
    {active && <section style={{marginTop:24,maxWidth:1150}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:12}}>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}><strong>TryBox embedded session / player</strong><button type="button" onClick={reloadPlayer} style={{color:'white',background:'#32343e',border:0,padding:'10px 15px',borderRadius:7,cursor:'pointer'}}>Reload player</button></div>
        <a href={active} target="_blank" rel="noreferrer" style={{color:'white',textDecoration:'none',background:'#2e313b',padding:'10px 15px',borderRadius:7}}>Open directly ↗</a>
      </div>
      <div style={{width:'100%',aspectRatio:'16 / 9',background:'#000',borderRadius:10,overflow:'hidden',border:'1px solid #383b44'}}>
        <iframe key={active + ':' + frameVersion} src={active} title="TryBox player" onLoad={()=>setLoaded(true)} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={{width:'100%',height:'100%',border:0}} />
      </div>
      <p style={{color:'#aeb0b9',fontSize:13,lineHeight:1.6}}>If TryBox prompts you to sign in again inside this embedded page, its session is not available here. Movie cannot transfer or override that login. {loaded ? 'Page load event received; playback is not independently verified.' : ''}</p>
    </section>}
  </main>;
}
