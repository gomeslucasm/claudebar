export interface PassthroughWidget {
    widget: 'passthrough';
    command: string;
}
export interface NewsWidget {
    widget: 'news';
    sources: string[];
    interval?: number;
}
export interface SoccerWidget {
    widget: 'soccer';
    sources: string[];
    interval?: number;
}
export interface WorldCupWidget {
    widget: 'worldcup';
    interval?: number;
}
export type WidgetConfig = PassthroughWidget | NewsWidget | SoccerWidget | WorldCupWidget;
export type LineConfig = WidgetConfig[];
export type Profile = LineConfig[];
export interface ProfileSwitch {
    at: string;
    profile: string;
}
export interface ManualOverride {
    profile: string;
    until: string;
}
export type Lang = 'en' | 'pt';
export interface ClaudebarConfig {
    lang: Lang;
    activeProfile: string;
    profiles: Record<string, Profile>;
    switches: ProfileSwitch[];
    override?: ManualOverride;
}
