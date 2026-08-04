import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const fileId = new URL(request.url).searchParams.get('fileId');

    if (!token || !fileId) {
        return NextResponse.json({ error: 'Receipt is unavailable' }, { status: 400 });
    }

    try {
        const metadataResponse = await fetch(
            `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
            { cache: 'no-store' }
        );
        const metadata = await metadataResponse.json();
        if (!metadataResponse.ok || !metadata?.ok || !metadata.result?.file_path) {
            return NextResponse.json({ error: 'Receipt was not found' }, { status: 404 });
        }

        const fileResponse = await fetch(
            `https://api.telegram.org/file/bot${token}/${metadata.result.file_path}`,
            { cache: 'no-store' }
        );
        if (!fileResponse.ok || !fileResponse.body) {
            return NextResponse.json({ error: 'Receipt download failed' }, { status: 502 });
        }

        return new NextResponse(fileResponse.body, {
            headers: {
                'Content-Type': fileResponse.headers.get('content-type') || 'image/jpeg',
                'Content-Disposition': 'inline; filename="receipt"',
                'Cache-Control': 'private, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Telegram receipt proxy error:', error);
        return NextResponse.json({ error: 'Receipt download failed' }, { status: 500 });
    }
}
