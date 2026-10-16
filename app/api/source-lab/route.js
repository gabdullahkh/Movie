import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Embedded TMDBEAPI provider code (original project: Miles946/TMDBEAPI).
// This route is isolated from the existing TMDB API and URPlayer.
const providers = {
  "showbox": () => require('../../../lib/tmdbeapi/providers/Showbox.js').getStreamsFromTmdbId,
  "4khdhub": () => require('../../../lib/tmdbeapi/providers/4khdhub.js').get4KHDHubStreams,
  "vixsrc": () => require('../../../lib/tmdbeapi/providers/vixsrc.js').getVixsrcStreams,
  "videasy": () => require('../../../lib/tmdbeapi/providers/videasy.js').getVideasyStreams,
  "vidlink": () => require('../../../lib/tmdbeapi/providers/vidlink.js').getVidlinkStreams,
  "dahmermovies": () => require('../../../lib/tmdbeapi/providers/dahmermovies.js').getDahmermoviesStreams,
  "streamflix": () => require('../../../lib/tmdbeapi/providers/streamflix.js').getStreamflixStreams,
  "vaplayer": () => require('../../../lib/tmdbeapi/providers/vaplayer.js').getVaplayerStreams,
  "castletv": () => require('../../../lib/tmdbeapi/providers/castletv.js').getCastletvStreams,
  "hdghartv": () => require('../../../lib/tmdbeapi/providers/hdghartv.js').getHdghartvStreams,
  "netmirror": () => require('../../../lib/tmdbeapi/providers/netmirror.js').getNetmirrorStreams,
  "onetouchtv": () => require('../../../lib/tmdbeapi/providers/onetouchtv.js').getOnetouchtvStreams,
  "zxcstreams": () => require('../../../lib/tmdbeapi/providers/zxcstreams.js').getZxcstreamsStreams
};
const providerNames = Object.keys(providers);
const json = (value, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
async function runProvider(name, context) {
    let fetcher;
    try { fetcher = providers[name](); }
    catch (error) { return { name, streams: [], error: 'Provider failed to load: ' + error.message }; }
    if (typeof fetcher !== 'function') return { name, streams: [], error: 'Provider function unavailable.' };
    try {
        const args = name === 'showbox'
            ? [context.type, context.id, context.season, context.episode, null, null]
            : [context.id, context.type, context.season, context.episode];
        const result = await Promise.race([
            fetcher(...args),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Provider timed out')), 18000))
        ]);
        return { name, streams: Array.isArray(result) ? result.map(x => ({ ...x, provider: x.provider || name })) : [] };
    } catch (error) {
        console.error('[Source Lab]', name, error.message);
        return { name, streams: [], error: error.message };
    }
}
export async function GET(request) {
    const q = new URL(request.url).searchParams;
    const action = q.get('action');
    if (action === 'health') return json({ status: 'ok', mode: 'embedded', providers: providerNames, tmdbApiKeyConfigured: Boolean(process.env.TMDB_API_KEY) });
    if (action !== 'streams') return json({ error: 'Unknown action.' }, 400);
    const kind = q.get('type');
    const id = q.get('tmdbId');
    if (!['movie', 'series', 'tv'].includes(kind) || !/^\d{1,12}$/.test(id || '') || Number(id) < 1) return json({ error: 'Invalid TMDB ID or content type.' }, 400);
    const type = kind === 'movie' ? 'movie' : 'tv';
    const provider = q.get('provider') || 'all';
    if (provider !== 'all' && !providers[provider]) return json({ error: 'Unknown provider.' }, 400);
    const season = type === 'tv' ? Number(q.get('season')) : null;
    const episode = type === 'tv' ? Number(q.get('episode')) : null;
    if (type === 'tv' && (!Number.isInteger(season) || season < 1 || season > 999 || !Number.isInteger(episode) || episode < 1 || episode > 999)) return json({ error: 'Invalid season or episode.' }, 400);
    const selected = provider === 'all' ? providerNames : [provider];
    const context = { type, id, season, episode };
    const result = [];
    // Limit simultaneous provider requests to avoid overwhelming the serverless function.
    for (let i = 0; i < selected.length; i += 4) {
        result.push(...await Promise.all(selected.slice(i, i + 4).map(name => runProvider(name, context))));
    }
    const streams = result.flatMap(item => item.streams);
    return json({ streams, checked: selected.length, errors: result.filter(x => x.error).map(x => ({ provider: x.name, error: x.error })) });
}