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

// A line is one or more widgets cycling together.
// Passthrough is always solo (output is opaque).
export type LineConfig = WidgetConfig[];

// A profile is a complete, named set of lines.
export type Profile = LineConfig[];

// A scheduled switch flips the active profile at a wall-clock time ("HH:MM").
export interface ProfileSwitch {
  at: string;
  profile: string;
}

// Set when the user switches profile by hand; holds until the next scheduled
// switch fires (`until` is an absolute timestamp).
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
