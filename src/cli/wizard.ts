import * as p from '@clack/prompts';
import { NEWS_SOURCES } from '../widgets/news.js';
import { SOCCER_SOURCES } from '../widgets/soccer.js';
import type { Messages } from '../i18n.js';
import type { LineConfig, WidgetConfig } from '../types.js';

// Shared interactive line builder, used by both `init` and `profile add/edit`.

export type Detected = { name: string; command: string } | null;

export function bail(v: unknown): asserts v is NonNullable<typeof v> {
  if (p.isCancel(v)) { p.cancel('Cancelled.'); process.exit(0); }
}

export function lineLabel(line: LineConfig, m: Messages): string {
  if (!line.length) return m.empty;
  return line.map(w => {
    if (w.widget === 'passthrough') return w.command.length > 40 ? w.command.slice(0, 37) + '…' : w.command;
    if (w.widget === 'news')     return m.labelNews(w.sources.join(', '));
    if (w.widget === 'soccer')   return m.labelSoccer(w.sources.join(', '));
    if (w.widget === 'worldcup') return m.labelWorldcup;
    return (w as WidgetConfig).widget;
  }).join(' + ');
}

export function hours(): { value: string; label: string }[] {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (const min of [0, 30]) {
      const val = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
      opts.push({ value: val, label: val });
    }
  }
  return opts;
}

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

async function configureLine(lineNum: number, m: Messages, detected: Detected): Promise<LineConfig> {
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

export async function configureLines(m: Messages, detected: Detected): Promise<LineConfig[]> {
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
