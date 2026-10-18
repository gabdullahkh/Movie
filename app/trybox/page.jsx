'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TryBoxPage() {
  const [kind, setKind] = useState('movie');
  const [id, setId] = useState('1058424');
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
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
    localStorage.setItem('movie.trybox.settings', JSON.stringify({ kind, id, season, episode }));
    window.open(next, '_blank', 'noopener,noreferrer');
  }
  return <main style={{minHeight:'100vh',padding:'28px max(4%, 18px)',background:'#090a0e',color:'#f6f6f7'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:15,flexWrap:'wrap',marginBottom:28}}>
      <div><h1 style={{margin:'0 0 8px',fontSize:29}}>TryBox <span style={{color:'#ef777f',fontSize:13}}>External player</span></h1><p style={{color:'#adb0bc',margin:0}}>Opens directly on TryBox so Google sign-in is not blocked by an iframe. Movie and URPlayer are unchanged.</p></div>
      <Link href="/" style={{color:'white',textDecoration:'none',background:'#2b2d34',borderRadius:7,padding:'12px 16px'}}>← Back to Movie</Link>
    </header>
    <form onSubmit={start} style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'end',padding:18,background:'#17191f',border:'1px solid #343640',borderRadius:12}}>
      <label style={{display:'grid',gap:8,flex:'1 1 140px'}}>Content type<select style={inputStyle} value={kind} onChange={e=>setKind(e.target.value)}><option value="movie">Movie</option><option value="tv">TV show</option></select></label>
      <label style={{display:'grid',gap:8,flex:'2 1 190px'}}>TMDB ID<input style={inputStyle} required min="1" type="number" value={id} onChange={e=>setId(e.target.value)} /></label>
      {kind === 'tv' && <>
        <label style={{display:'grid',gap:8,flex:'1 1 100px'}}>Season<input style={inputStyle} required min="1" type="number" value={season} onChange={e=>setSeason(e.target.value)}/></label>
        <label style={{display:'grid',gap:8,flex:'1 1 100px'}}>Episode<input style={inputStyle} required min="1" type="number" value={episode} onChange={e=>setEpisode(e.target.value)}/></label>
      </>}
      <button type="submit" style={{background:'#e50914',border:0,color:'#fff',fontWeight:700,borderRadius:7,padding:'13px 24px'}}>Open on TryBox ↗</button>
    </form>
    <section style={{maxWidth:900,marginTop:24,color:'#adb0bc',lineHeight:1.7}}>
      <p>Sign in with Google directly on TryBox. Your login session is managed by TryBox in your browser, not by Movie.</p>
      <p>Movie remembers your selected content type, TMDB ID, season, and episode on this device. TryBox decides how long its login stays active.</p>
      <a href="https://trybox.app/" target="_blank" rel="noopener noreferrer" style={{color:'#fff',textDecoration:'underline'}}>Open TryBox homepage ↗</a>
    </section>
  </main>;
}
