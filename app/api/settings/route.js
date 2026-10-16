import { NextResponse } from 'next/server';

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
        return NextResponse.json({ configured: false, settings: {} });
    }
    try {
        const response = await fetch(url.replace(/\/$/, '') + '/rest/v1/site_settings?select=key,value', {
            headers: { apikey: key, Authorization: 'Bearer ' + key },
            next: { revalidate: 300 }
        });
        if (!response.ok) {
            return NextResponse.json({ configured: false, settings: {}, error: 'Settings unavailable' });
        }
        const data = await response.json();
        return NextResponse.json({
            configured: true,
            settings: Object.fromEntries(data.map(x => [x.key, x.value]))
        });
    } catch {
        return NextResponse.json({ configured: false, settings: {} });
    }
}
