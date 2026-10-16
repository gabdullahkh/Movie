# Movie

Bilingual (English/Arabic) Next.js movie and TV discovery app.

## Features
- TMDB movies, TV shows, posters, trending, search, seasons and episodes.
- Recent releases available on Netflix, Prime Video and Disney+ in Saudi Arabia, filtered through TMDB watch-provider data. **These rows do not establish the date a title was added to a streaming service.**
- Embedded URPlayer, inside a sandboxed iframe that denies popup windows and top-level navigation. Advertisements inside the iframe remain under the provider's control; restrictive sandboxing may affect playback.
- Optional email/password accounts via Supabase Auth. Browsing and playback do not require login.
- Watchlist and viewing history are stored locally for guests and in the protected `user_library` table for signed-in accounts.
- Supabase `site_settings` controls shared homepage settings.

## Hosting
Next.js framework, repository root `./`, build command `npm run build`, Node.js 22.

Required hosting environment variable: `TMDB_API_KEY`, or alternatively `TMDB_READ_ACCESS_TOKEN`. Never commit a TMDB API credential to GitHub.

Supabase project `wdezottacdblvhmzbizu` uses a public publishable key for browser access and Row Level Security for account-specific database rows. Never put a Supabase secret/service-role key in the frontend.

## Important Supabase Auth settings
Open Supabase Dashboard → Authentication → URL Configuration.
- Set the **Site URL** to the production website origin (e.g. `https://your-project.vercel.app`).
- Add the same production origin or `https://your-project.vercel.app/**` to **Redirect URLs**.
- Enable the Email authentication provider in Authentication → Providers.
- Configure email confirmation/SMTP as appropriate for account signup. Supabase may enforce email sending limits.

## Attribution and restrictions
This product uses the TMDB API but is not endorsed or certified by TMDB. Media streaming is delivered by URPlayer, not TMDB. Rights/licensing of third-party video content must be assessed prior to public operation.
