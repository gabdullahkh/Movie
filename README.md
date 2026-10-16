# Movie

Netflix-inspired, bilingual (Arabic/English) movie and TV discovery website using the official TMDB API and an embedded URPlayer.

## Deployment
1. Import this repository into Vercel (Next.js preset).
2. Get a **v3 API Key** from https://www.themoviedb.org/settings/api
3. Once development and testing are complete, add `TMDB_API_KEY` to the hosting environment. Vercel deployment is deliberately reserved for the final step.
4. Open the site. No authentication is required.

## Features
- Trending, popular, top rated, search, movie/TV genre discovery
- Film details and series seasons/episodes
- Language toggle (Arabic/English), responsive design
- Watchlist and continue watching stored in each device's localStorage; **not synced between devices**
- Movie player: `https://urplayer.net/embed/movie/{tmdb_id}`
- Episode player: `https://urplayer.net/embed/tv/{tmdb_id}/{season}/{episode}`

## Supabase (optional; no authentication)
Supabase project `wdezottacdblvhmzbizu` is connected for read-only public site settings (`public.site_settings`) using a publishable key. The homepage can optionally pin featured TMDB IDs from `homepage.featured_movie_ids` or `homepage.featured_tv_ids`, if those titles appear in the trending response. Anonymous viewers cannot securely own cross-device records without authentication. The settings table has Row Level Security enabled and grants only public SELECT. **Do not create public write policies for personal viewing data.** The current app does not send viewing histories to Supabase.

## Notes
This product uses the TMDB API but is not endorsed or certified by TMDB. TMDB attribution appears in the footer. Streaming is delivered by URPlayer, not TMDB. URPlayer may show ads or redirect users; embedded player internals are outside the website's control. Check rights, licensing and terms before publishing.
