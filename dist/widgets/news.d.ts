import type { NewsWidget } from '../types.js';
export declare const NEWS_SOURCES: Record<string, string>;
export declare function getItems(config: NewsWidget): Promise<string[]>;
