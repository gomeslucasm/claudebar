import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { CACHE_DIR } from '../config.js';
export function loadCache(name, ttlSeconds) {
    const file = `${CACHE_DIR}/${name}.json`;
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
    writeFileSync(`${CACHE_DIR}/${name}.json`, JSON.stringify(entry));
}
