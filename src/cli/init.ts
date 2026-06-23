import * as p from '@clack/prompts';
import { saveConfig, saveClaudeSettings, loadClaudeSettings, configExists } from '../config.js';
import { detectExistingStatusLine } from './detect.js';
import { NEWS_SOURCES } from '../widgets/news.js';
import { SOCCER_SOURCES } from '../widgets/soccer.js';
import { messages, type Messages } from '../i18n.js';
import type { ClaudebarConfig, LineConfig, WidgetConfig, ProfileSwitch, Lang } from '../types.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function bail(v: unknown): asserts v is NonNullable<typeof v> {
  if (p.isCancel(v)) { p.cancel('Cancelled.'); process.exit(0); }
}

function lineLabel(line: LineConfig, m: Messages): string {
  if (!line.length) return m.empty;
  return line.map(w => {
    if (w.widget === 'passthrough') return w.command.length > 40 ? w.command.slice(0, 37) + '…' : w.command;
    if (w.widget === 'news')     return m.labelNews(w.sources.join(', '));
    if (w.widget === 'soccer')   return m.labelSoccer(w.sources.join(', '));
    if (w.widget === 'worldcup') return m.labelWorldcup;
    return (w as WidgetConfig).widget;
  }).join(' + ');
}

// ─── time selection ──────────────────────────────────────────────────────────

function hours(): { value: string; label: string }[] {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (const min of [0, 30]) {
      const val = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
      opts.push({ value: val, label: val });
    }
  }
  return opts;
}

// ─── widget configuration ────────────────────────────────────────────────────

type WidgetType = 'ccstatusline' | 'passthrough' | 'custom' | 'news' | 'soccer' | 'worldcup';

async function configureWidget(type: WidgetType, m: Messages, detectedCmd: string | null): Promise<WidgetConfig> {
  if (type === 'ccstatusline') return { widget: 'passthrough', command: detectedCmd! };
  if (type === 'passthrough')  return { widget: 'passthrough', command: 'npx -y ccstatusline@latest' };

  if (type === 'custom') {
    const command = await p.text({ message: m.commandPrompt, placeholder: '~/my-script.sh' });
    bail(command);
    return { widget: 'passthrough', command: command as string };
  }

  const interval = async () => {
    const v = await p.select({
      message: m.secondsPerItem,
      options: [5,10,15,20,30].map(n => ({ value: String(n), label: `${n}s` })),
      initialValue: '10',
    });
    bail(v);
    return Number(v);
  };

  if (type === 'news') {
    const sources = await p.multiselect<string>({
      message: m.newsSources,
      options: Object.keys(NEWS_SOURCES).map(s => ({ value: s, label: s })),
      initialValues: Object.keys(NEWS_SOURCES),
    });
    bail(sources);
    return { widget: 'news', sources: sources as string[], interval: await interval() };
  }

  if (type === 'soccer') {
    const sources = await p.multiselect<string>({
      message: m.soccerSources,
      options: Object.keys(SOCCER_SOURCES).map(s => ({ value: s, label: s })),
      initialValues: Object.keys(SOCCER_SOURCES),
    });
    bail(sources);
    return { widget: 'soccer', sources: sources as string[], interval: await interval() };
  }

  return { widget: 'worldcup', interval: await interval() };
}

async function configureLine(lineNum: number, m: Messages, detected: { name: string; command: string } | null): Promise<LineConfig> {
  p.log.step(m.line(lineNum));

  const soloOptions: { value: WidgetType; label: string; hint?: string }[] = [];
  if (detected) {
    soloOptions.push({ value: 'ccstatusline', label: detected.name, hint: m.soloHintDetected });
  } else {
    soloOptions.push({ value: 'passthrough', label: 'ccstatusline', hint: m.soloHintCcsl });
  }
  soloOptions.push({ value: 'custom', label: m.customCommand, hint: m.soloHintCustom });

  const contentOptions: { value: WidgetType; label: string }[] = [
    { value: 'news',     label: m.wNews },
    { value: 'soccer',   label: m.wSoccer },
    { value: 'worldcup', label: m.wWorldcup },
  ];

  const firstType = await p.select<WidgetType>({
    message: m.whatGoesHere,
    options: [...soloOptions, ...contentOptions],
  });
  bail(firstType);

  // solo widgets — can't combine
  if (['ccstatusline', 'passthrough', 'custom'].includes(firstType as string)) {
    return [await configureWidget(firstType as WidgetType, m, detected?.command ?? null)];
  }

  // content widgets — can combine more
  const widgets: WidgetConfig[] = [await configureWidget(firstType as WidgetType, m, null)];

  while (true) {
    const more = await p.confirm({ message: m.addAnotherWidget, initialValue: false });
    bail(more);
    if (!more) break;

    const remaining = contentOptions.filter(o => !widgets.find(w => w.widget === o.value));
    if (!remaining.length) { p.log.warn(m.noMoreWidgets); break; }

    const next = await p.select<WidgetType>({ message: m.widget, options: remaining });
    bail(next);
    widgets.push(await configureWidget(next as WidgetType, m, null));
  }

  return widgets;
}

// ─── lines with review/back ───────────────────────────────────────────────────

async function configureLines(m: Messages, detected: { name: string; command: string } | null): Promise<LineConfig[]> {
  const numStr = await p.text({ message: m.howManyLines, initialValue: '3' });
  bail(numStr);
  const num = Math.max(1, Number(numStr));

  const lines: LineConfig[] = [];
  for (let i = 0; i < num; i++) lines.push(await configureLine(i + 1, m, detected));

  // Review loop — lets the user go back and reconfigure any line
  while (true) {
    p.log.message('');
    p.log.message(m.summary);
    lines.forEach((l, i) => p.log.message(`  ${i + 1}. ${lineLabel(l, m)}`));

    const action = await p.select({
      message: m.whatToDo,
      options: [
        { value: 'confirm', label: m.confirm },
        ...lines.map((_, i) => ({ value: String(i), label: m.reconfigureLine(i + 1) })),
      ],
    });
    bail(action);
    if (action === 'confirm') break;
    lines[Number(action)] = await configureLine(Number(action) + 1, m, detected);
  }

  return lines;
}

// ─── profiles ────────────────────────────────────────────────────────────────

async function configureProfiles(m: Messages, detected: { name: string; command: string } | null): Promise<Record<string, LineConfig[]>> {
  const profiles: Record<string, LineConfig[]> = {};

  while (true) {
    const first = Object.keys(profiles).length === 0;
    const nameRaw = await p.text({
      message: m.profileName,
      placeholder: first ? 'default' : 'evening',
      initialValue: first ? 'default' : '',
    });
    bail(nameRaw);
    let name = (nameRaw as string).trim() || (first ? 'default' : `profile${Object.keys(profiles).length + 1}`);
    while (profiles[name]) name += '-2'; // avoid clobbering a duplicate name

    p.log.step(m.configureProfile(name));
    profiles[name] = await configureLines(m, detected);

    const more = await p.confirm({ message: m.addAnotherProfile, initialValue: false });
    bail(more);
    if (!more) break;
  }

  return profiles;
}

// ─── scheduled switches ────────────────────────────────────────────────────────

async function configureSwitches(m: Messages, names: string[]): Promise<ProfileSwitch[]> {
  const switches: ProfileSwitch[] = [];
  const profileOptions = names.map(n => ({ value: n, label: n }));

  let addMore = true;
  while (addMore) {
    const at = await p.select({ message: m.switchAt, options: hours() });
    bail(at);
    const profile = await p.select({ message: m.switchToProfile, options: profileOptions });
    bail(profile);
    switches.push({ at: at as string, profile: profile as string });

    const more = await p.confirm({ message: m.addAnotherSwitch, initialValue: false });
    bail(more);
    addMore = more as boolean;
  }

  return switches;
}

// ─── main ────────────────────────────────────────────────────────────────────

export async function init(): Promise<void> {
  const lang = await p.select<Lang>({
    message: 'Language / Idioma',
    options: [
      { value: 'en', label: 'English' },
      { value: 'pt', label: 'Português (BR)' },
    ],
    initialValue: 'en',
  });
  bail(lang);
  const m = messages(lang as Lang);

  p.intro(m.intro);

  if (configExists()) {
    const overwrite = await p.confirm({ message: m.overwrite, initialValue: false });
    bail(overwrite);
    if (!overwrite) { p.cancel(m.cancelled); return; }
  }

  const detected = detectExistingStatusLine();
  if (detected) p.note(`"${detected.command}"`, m.detected(detected.name));

  // ── Profiles ──
  p.log.message(m.profilesSection);
  const profiles = await configureProfiles(m, detected);
  const names = Object.keys(profiles);

  // ── Active profile ──
  let activeProfile = names[0];
  if (names.length > 1) {
    const a = await p.select({ message: m.chooseActive, options: names.map(n => ({ value: n, label: n })) });
    bail(a);
    activeProfile = a as string;
  }

  // ── Time-based switching ──
  let switches: ProfileSwitch[] = [];
  if (names.length > 1) {
    const auto = await p.confirm({ message: m.setupSwitching, initialValue: false });
    bail(auto);
    if (auto) switches = await configureSwitches(m, names);
  }

  const config: ClaudebarConfig = { lang: lang as Lang, activeProfile, profiles, switches };
  saveConfig(config);

  const updateSettings = await p.confirm({ message: m.updateSettings, initialValue: true });
  bail(updateSettings);
  if (updateSettings) {
    const settings = loadClaudeSettings();
    settings.statusLine = { type: 'command', command: 'claudebar run', padding: 0, refreshInterval: 1000 };
    saveClaudeSettings(settings);
  }

  p.outro(m.done);
}
