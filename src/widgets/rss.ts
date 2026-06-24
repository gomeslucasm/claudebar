import https from 'https';
import http from 'http';

export interface RssItem {
  title: string;
  link: string;
}

// Decodes the body honoring the charset declared in the XML prolog or
// Content-Type header. Brazilian feeds (Folha, UOL) are often ISO-8859-1.
function decodeBody(buf: Buffer, contentType?: string): string {
  const head = buf.subarray(0, 200).toString('latin1').toLowerCase();
  const declared =
    (/charset=([\w-]+)/.exec(contentType ?? '')?.[1]) ??
    (/encoding=["']([\w-]+)["']/.exec(head)?.[1]) ??
    'utf-8';
  const enc = declared.toLowerCase();
  if (enc === 'iso-8859-1' || enc === 'latin1' || enc === 'windows-1252') {
    return buf.toString('latin1');
  }
  return buf.toString('utf8');
}

// Rejects URLs that aren't http(s) or that point at loopback / link-local /
// private address space, so a redirect from a feed can't be used to probe the
// local network or a cloud metadata endpoint (SSRF).
function isSafeUrl(url: string): boolean {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    host = u.hostname;
  } catch {
    return false;
  }
  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 127 || a === 10 || a === 0 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)) return false;
  }
  // IPv6 loopback / unique-local / link-local.
  if (host === '::1' || /^\[?(::1|f[cd][0-9a-f]{2}:|fe80:)/i.test(host)) return false;
  return true;
}

function fetch(url: string, redirects = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isSafeUrl(url)) return reject(new Error('blocked url'));
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirects >= 5) return reject(new Error('too many redirects'));
        const next = new URL(res.headers.location, url).toString();
        return fetch(next, redirects + 1).then(resolve).catch(reject);
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(decodeBody(Buffer.concat(chunks), res.headers['content-type'])));
    });
    req.setTimeout(6000, () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

export async function fetchRss(url: string, max = 10): Promise<RssItem[]> {
  try {
    const xml = await fetch(url);
    const items: RssItem[] = [];
    const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(xml)) !== null && items.length < max) {
      const block = m[1];
      const title = (/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]>/.exec(block) ??
                     /<title[^>]*>([\s\S]*?)<\/title>/.exec(block))?.[1]?.trim() ?? '';
      let link  = (/<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]>/.exec(block) ??
                   /<link[^>]*>([\s\S]*?)<\/link>/.exec(block) ??
                   /<link\s[^>]*href="([^"]+)"/.exec(block))?.[1]?.trim() ?? '';
      link = link.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
      if (title) items.push({ title, link });
    }
    return items;
  } catch {
    return [];
  }
}
