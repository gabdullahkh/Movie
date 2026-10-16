'use client';
import { useEffect } from 'react';
export default function ErrorPage({ error, reset }) {
  useEffect(() => { console.error('Movie client error:', error); }, [error]);
  return <main style={{minHeight:'100vh',background:'#090a10',color:'#fff',padding:'15vh 8%',fontFamily:'Arial,sans-serif'}}>
    <h1>Movie could not load</h1>
    <p style={{color:'#bbb'}}>The application encountered an error. Try reloading. The technical details are available in your browser console.</p>
    <button onClick={reset} style={{background:'#e50914',border:0,borderRadius:8,padding:'12px 22px',color:'#fff',cursor:'pointer'}}>Try again</button>
    <details style={{marginTop:24,color:'#aaa'}}><summary>Error details</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{error?.message||'Unknown error'}</pre></details>
  </main>;
}
