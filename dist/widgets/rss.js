import https from 'https';
import http from 'http';
// Decodes the body honoring the charset declared in the XML prolog or
// Content-Type header. Brazilian feeds (Folha, UOL) are often ISO-8859-1.
function decodeBody(buf, contentType) {
    const head = buf.subarray(0, 200).toString('latin1').toLowerCase();
    const declared = (/charset=([\w-]+)/.exec(contentType ?? '')?.[1]) ??
        (/encoding=["']([\w-]+)["']/.exec(head)?.[1]) ??
        'utf-8';
    const enc = declared.toLowerCase();
    if (enc === 'iso-8859-1' || enc === 'latin1' || enc === 'windows-1252') {
        return buf.toString('latin1');
    }
    return buf.toString('utf8');
}
function fetch(url) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetch(res.headers.location).then(resolve).catch(reject);
            }
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(decodeBody(Buffer.concat(chunks), res.headers['content-type'])));
        });
        req.setTimeout(6000, () => { req.destroy(); reject(new Error('timeout')); });
        req.on('error', reject);
    });
}
export async function fetchRss(url, max = 10) {
    try {
        const xml = await fetch(url);
        const items = [];
        const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/g;
        let m;
        while ((m = itemRe.exec(xml)) !== null && items.length < max) {
            const block = m[1];
            const title = (/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]>/.exec(block) ??
                /<title[^>]*>([\s\S]*?)<\/title>/.exec(block))?.[1]?.trim() ?? '';
            let link = (/<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]>/.exec(block) ??
                /<link[^>]*>([\s\S]*?)<\/link>/.exec(block) ??
                /<link\s[^>]*href="([^"]+)"/.exec(block))?.[1]?.trim() ?? '';
            link = link.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
            if (title)
                items.push({ title, link });
        }
        return items;
    }
    catch {
        return [];
    }
}
