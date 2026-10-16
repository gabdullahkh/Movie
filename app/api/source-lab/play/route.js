import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createPlaybackUrl, safeRemoteUrl, verifyPlaybackToken } from '../../../../lib/source-lab-playback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function publicAddress(address) {
    const a = address.toLowerCase();
    if (a.startsWith('::ffff:')) return publicAddress(a.slice(7));
    if (isIP(a) === 4) {
        const parts = a.split('.').map(Number);
        const [x, y] = parts;
        return !(x === 0 || x === 10 || x === 127 || x >= 224 ||
            x === 169 && y === 254 || x === 172 && y >= 16 && y <= 31 ||
            x === 192 && y === 168 || x === 100 && y >= 64 && y <= 127 ||
            x === 192 && y === 0 || x === 192 && y === 0 && parts[2] === 2 ||
            x === 198 && (y === 18 || y === 19 || y === 51) ||
            x === 203 && y === 0 && parts[2] === 113);
    }
    if (isIP(a) === 6) {
        return !(a === '::' || a === '::1' || a.startsWith('fc') ||
            a.startsWith('fd') || a.startsWith('fe') ||
            a.startsWith('2001:db8:') || a.startsWith('2001:0db8:'));
    }
    return false;
}
async function validateUrl(value) {
    const safe = safeRemoteUrl(value);
    if (!safe) throw new Error('Blocked remote URL');
    const records = await lookup(new URL(safe).hostname, {all: true, verbatim: true});
    if (!records.length || !records.every(x => publicAddress(x.address))) throw new Error('Blocked network address');
    return safe;
}
function isPlaylist(contentType, url, text) {
    return /mpegurl|x-mpegurl/i.test(contentType) || /\.m3u8(?:\?|$)/i.test(url) || text.startsWith('#EXTM3U');
}
function rewritePlaylist(body, base, headers, expiry) {
    const lines = body.replace(/\r/g, '').split('\n');
    const rewrite = raw => {
        try {
            const absolute = new URL(raw.trim(), base).toString();
            return createPlaybackUrl(absolute, headers, expiry) || '';
        } catch { return ''; }
    };
    return lines.map(line => {
        if (line.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_, src) => {
            const next = rewrite(src);
            return next ? 'URI="' + next + '"' : 'URI=""';
        });
        if (!line.trim()) return line;
        return rewrite(line);
    }).join('\n');
}
export async function GET(request) {
    const token = new URL(request.url).searchParams.get('t');
    const payload = verifyPlaybackToken(token);
    if (!payload) return NextResponse.json({error:'Invalid or expired video link.'},{status:403});
    let current = payload.u, response;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
        for(let redirect=0; redirect<4; redirect++){
            await validateUrl(current);
            response = await fetch(current, {
                headers: {
                    'Accept':'*/*',
                    ...(payload.h || {}),
                    ...(request.headers.get('range') ? {'Range':request.headers.get('range').slice(0,100)} : {})
                }, redirect:'manual', cache:'no-store', signal:controller.signal
            });
            if ([301,302,303,307,308].includes(response.status)) {
                const loc=response.headers.get('location');
                if (!loc) throw Error('Redirect missing location');
                current=new URL(loc,current).toString();
                response.body?.cancel().catch(()=>{});
                response=null;
                continue;
            }
            break;
        }
        if(!response) throw Error('Too many redirects');
        if(!response.ok && response.status!==206) return NextResponse.json({error:'Upstream video server returned HTTP '+response.status},{status:502});
        const ct=response.headers.get('content-type') || '';
        const playlist=/mpegurl|x-mpegurl/i.test(ct) || /\.m3u8(?:\?|$)/i.test(current);
        if (playlist) {
            const raw=await response.text();
            if(raw.length>4_000_000) throw Error('Playlist is too large');
            return new Response(rewritePlaylist(raw,current,payload.h,payload.e),{
                status:200,headers:{'Content-Type':'application/vnd.apple.mpegurl','Cache-Control':'private, no-store','Access-Control-Allow-Origin':'*'}
            });
        }
        if (/text\/html|application\/json/i.test(ct)) return NextResponse.json({error:'Video server returned a web page instead of video.'},{status:502});
        const headers=new Headers({
            'Content-Type':ct || 'application/octet-stream',
            'Cache-Control':'private, no-store',
            'Access-Control-Allow-Origin':'*'
        });
        for(const key of ['content-length','content-range','accept-ranges']){
            const val=response.headers.get(key); if(val)headers.set(key,val);
        }
        return new Response(response.body,{status:response.status,headers});
    }catch(error){
        return NextResponse.json({error:'Video relay failed: '+error.message},{status:502});
    }finally{clearTimeout(timer);}
}
