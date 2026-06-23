import { loadCache, saveCache } from './cache.js';
import { fetchRss } from './rss.js';
import { shorten } from './shorten.js';
const CACHE_TTL = 900;
export const SOCCER_SOURCES = {
    'GloboEsporte': 'https://ge.globo.com/rss/futebol/',
    'ESPN-soccer': 'https://www.espn.com/espn/rss/soccer/news',
    'BBC-sport': 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    'UOL-esporte': 'https://rss.uol.com.br/feed/esportes.xml',
};
async function fetchItems(sources) {
    const all = [];
    for (const src of sources) {
        const url = SOCCER_SOURCES[src];
        if (!url)
            continue;
        const items = await fetchRss(url, 8);
        for (const item of items) {
            const short = item.link ? await shorten(item.link) : '';
            all.push({ label: `[${src}] ${item.title}`, short });
        }
    }
    return all;
}
export async function getItems(config) {
    const sources = config.sources ?? Object.keys(SOCCER_SOURCES);
    const cacheKey = `soccer_${sources.join('_')}`;
    let items = loadCache(cacheKey, CACHE_TTL);
    if (!items) {
        items = await fetchItems(sources);
        if (!items.length)
            items = [{ label: '[futebol] sem conexão', short: '' }];
        saveCache(cacheKey, items);
    }
    return items.map(i => i.short ? `${i.label}  ${i.short}` : i.label);
}
