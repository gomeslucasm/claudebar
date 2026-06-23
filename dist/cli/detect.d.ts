export interface DetectedTool {
    name: string;
    command: string;
}
export declare function detectExistingStatusLine(): DetectedTool | null;
