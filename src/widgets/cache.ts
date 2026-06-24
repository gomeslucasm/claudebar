import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { CACHE_DIR } from '../config.js';

interface CacheEntry<T> {
  ts: number;
  data: T;
}

// Keep cache keys to a flat, filesystem-safe slug so a key derived from config
// (e.g. widget sources) can never escape CACHE_DIR via path separators or `..`.
function cacheFile(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${CACHE_DIR}/${safe}.json`;
}

export function loadCache<T>(name: string, ttlSeconds: number): T | null {
  const file = cacheFile(name);
  if (!existsSync(file)) return null;
  try {
    const entry = JSON.parse(readFileSync(file, 'utf8')) as CacheEntry<T>;
    if (Date.now() / 1000 - entry.ts < ttlSeconds) return entry.data;
  } catch { /* */ }
  return null;
}

export function saveCache<T>(name: string, data: T): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  const entry: CacheEntry<T> = { ts: Date.now() / 1000, data };
  writeFileSync(cacheFile(name), JSON.stringify(entry));
}
