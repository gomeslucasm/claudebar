export interface RssItem {
    title: string;
    link: string;
}
export declare function fetchRss(url: string, max?: number): Promise<RssItem[]>;
