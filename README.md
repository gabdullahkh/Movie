# Movie

Netflix-inspired, bilingual (Arabic/English) movie and TV discovery website using the official TMDB API and an embedded URPlayer.

## Deployment
1. Import this repository into Vercel (Next.js preset).
2. Get an **API Read Access Token** from https://www.themoviedb.org/settings/api
3. Add `TMDB_READ_ACCESS_TOKEN` to Vercel Environment Variables. Redeploy.
4. Open the site. No authentication is required.

## Features
- Trending, popular, top rated, search, movie/TV genre discovery
- Film details and series seasons/episodes
- Language toggle (Arabic/English), responsive design
- Watchlist and continue watching stored in each device's localStorage; **not synced between devices**
- Movie player: `https://urplayer.net/embed/movie/{tmdb_id}`
- Episode player: `https://urplayer.net/embed/tv/{tmdb_id}/{season}/{episode}`

## Supabase (optional; no authentication)
Supabase is not necessary for personal watchlists because anonymous users cannot securely own cross-device records without authentication. Optionally configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for future shared public data, but **do not create public write policies for personal viewing data**. The current app does not send viewing histories to Supabase.

## Notes
This product uses the TMDB API but is not endorsed or certified by TMDB. TMDB attribution appears in the footer. Streaming is delivered by URPlayer, not TMDB. URPlayer may show ads or redirect users; embedded player internals are outside the website's control. Check rights, licensing and terms before publishing.
