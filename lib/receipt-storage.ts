import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

/** Store user-uploaded receipt images durably on Vercel, and locally during development. */
export async function storeReceiptImage(input: {
  buffer: Buffer;
  mimeType: string;
  folder: string;
  nameHint?: string;
}): Promise<string> {
  const extension = MIME_EXTENSIONS[input.mimeType];
  if (!extension) throw new Error('JPG, PNG ama WEBP kaliya ayaa la aqbalaa.');

  const safeHint = String(input.nameHint || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 50);
  const pathname = `${input.folder}/${Date.now()}-${safeHint}${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname, input.buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: input.mimeType
    });
    return blob.url;
  }

  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    throw new Error('Rasiidka si joogto ah looma kaydin karo: ku xidh Vercel Blob oo deji BLOB_READ_WRITE_TOKEN.');
  }

  const localPath = path.join(process.cwd(), 'public', 'uploads', pathname);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, input.buffer);
  return `/uploads/${pathname}`;
}

/** Read an uploaded receipt by its stored local path or public Blob URL. */
export async function readReceiptImage(receiptUrl: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (/^https?:\/\//i.test(receiptUrl)) {
    const response = await fetch(receiptUrl, { cache: 'no-store' });
    return response.ok ? {
      buffer: Buffer.from(await response.arrayBuffer()),
      mimeType: response.headers.get('content-type')?.split(';')[0] || 'image/jpeg'
    } : null;
  }
  const safePath = receiptUrl.replace(/^\/+/, '');
  const absolutePath = path.join(process.cwd(), 'public', safePath);
  const extension = path.extname(absolutePath).toLowerCase();
  const mimeType = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
  return fs.existsSync(absolutePath) ? { buffer: fs.readFileSync(absolutePath), mimeType } : null;
}
