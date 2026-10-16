import { NextResponse } from 'next/server';
const ALLOWED = new Set(['trending/all/week','trending/movie/week','trending/tv/week','movie/popular','movie/top_rated','movie/now_playing','tv/popular','tv/top_rated','tv/on_the_air','genre/movie/list','genre/tv/list','search/multi','discover/movie','discover/tv']);
export async function GET(request) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error:'TMDB_READ_ACCESS_TOKEN is not configured.' }, { status:503 });
  const p = new URL(request.url).searchParams;
  let path=p.get('path')||'trending/all/week';
  if (!ALLOWED.has(path) && !/^(movie|tv)\/\d{1,10}$/.test(path) && !/^tv\/\d{1,10}\/season\/\d{1,3}$/.test(path)) return NextResponse.json({error:'Invalid path'}, {status:400});
  const url = new URL('https://api.themoviedb.org/3/'+path);
  for (const key of ['language','page','query','with_genres','sort_by','include_adult']) {
    const v=p.get(key);
    if(v) url.searchParams.set(key, v.slice(0,key==='query'?150:40));
  }
  url.searchParams.set('include_adult','false');
  try {
    const response=await fetch(url,{headers:{Authorization:'Bearer '+token,accept:'application/json'},next:{revalidate:300}});
    const data=await response.json();
    return NextResponse.json(data,{status:response.ok?200:response.status,headers:{'Cache-Control':'public, s-maxage=120, stale-while-revalidate=300'}});
  } catch {return NextResponse.json({error:'Failed to contact TMDB'},{status:502});}
}
