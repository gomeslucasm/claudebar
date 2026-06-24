import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { CACHE_DIR } from '../config.js';
// Keep cache keys to a flat, filesystem-safe slug so a key derived from config
// (e.g. widget sources) can never escape CACHE_DIR via path separators or `..`.
function cacheFile(name) {
    const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${CACHE_DIR}/${safe}.json`;
}
export function loadCache(name, ttlSeconds) {
    const file = cacheFile(name);
    if (!existsSync(file))
        return null;
    try {
        const entry = JSON.parse(readFileSync(file, 'utf8'));
        if (Date.now() / 1000 - entry.ts < ttlSeconds)
            return entry.data;
    }
    catch { /* */ }
    return null;
}
export function saveCache(name, data) {
    mkdirSync(CACHE_DIR, { recursive: true });
    const entry = { ts: Date.now() / 1000, data };
    writeFileSync(cacheFile(name), JSON.stringify(entry));
}
