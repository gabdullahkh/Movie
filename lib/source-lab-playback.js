import { createHmac, timingSafeEqual } from 'node:crypto';

const secret = () => process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY;
const ip4 = host => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
export function safeRemoteUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443') return null;
        const host = url.hostname.toLowerCase().replace(/\.$/, '');
        if (!host.includes('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
            host.endsWith('.internal') || host.endsWith('.test') || host.endsWith('.invalid') ||
            host.endsWith('.example') || host.endsWith('.onion') || host.endsWith('.arpa') ||
            ip4(host) || host.includes(':') || host === 'metadata.google.internal') return null;
        return url.toString();
    } catch { return null; }
}
export function createPlaybackUrl(url, headers = {}, expiry) {
    if (!secret() || !safeRemoteUrl(url)) return null;
    const allowed = {};
    for (const key of ['Referer', 'Origin', 'User-Agent']) {
        const value = headers[key] || headers[key.toLowerCase()];
        if (typeof value === 'string' && value.length < 500) allowed[key] = value;
    }
    const data = Buffer.from(JSON.stringify({
        u: url, h: allowed,
        e: expiry || Date.now() + 30 * 60 * 1000
    })).toString('base64url');
    const mac = createHmac('sha256', secret()).update(data).digest('base64url');
    return '/api/source-lab/play?t=' + data + '.' + mac;
}
export function verifyPlaybackToken(token) {
    if (!secret() || typeof token !== 'string' || token.length > 16000) return null;
    const split = token.lastIndexOf('.');
    if (split < 1) return null;
    const data = token.slice(0, split), received = token.slice(split + 1);
    const expected = createHmac('sha256', secret()).update(data).digest('base64url');
    if (received.length !== expected.length ||
        !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
        if (!payload || !safeRemoteUrl(payload.u) || typeof payload.e !== 'number' ||
            payload.e < Date.now() || payload.e > Date.now() + 31 * 60 * 1000) return null;
        return payload;
    } catch { return null; }
}
