import type { Messages } from '../i18n.js';
import type { LineConfig } from '../types.js';
export type Detected = {
    name: string;
    command: string;
} | null;
export declare function bail(v: unknown): asserts v is NonNullable<typeof v>;
export declare function lineLabel(line: LineConfig, m: Messages): string;
export declare function hours(): {
    value: string;
    label: string;
}[];
export declare function configureLines(m: Messages, detected: Detected): Promise<LineConfig[]>;
