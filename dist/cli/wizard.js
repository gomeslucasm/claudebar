import * as p from '@clack/prompts';
import { NEWS_SOURCES } from '../widgets/news.js';
import { SOCCER_SOURCES } from '../widgets/soccer.js';
export function bail(v) {
    if (p.isCancel(v)) {
        p.cancel('Cancelled.');
        process.exit(0);
    }
}
export function lineLabel(line, m) {
    if (!line.length)
        return m.empty;
    return line.map(w => {
        if (w.widget === 'passthrough')
            return w.command.length > 40 ? w.command.slice(0, 37) + '…' : w.command;
        if (w.widget === 'news')
            return m.labelNews(w.sources.join(', '));
        if (w.widget === 'soccer')
            return m.labelSoccer(w.sources.join(', '));
        if (w.widget === 'worldcup')
            return m.labelWorldcup;
        return w.widget;
    }).join(' + ');
}
export function hours() {
    const opts = [];
    for (let h = 0; h < 24; h++) {
        for (const min of [0, 30]) {
            const val = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            opts.push({ value: val, label: val });
        }
    }
    return opts;
}
async function configureWidget(type, m, detectedCmd) {
    if (type === 'ccstatusline')
        return { widget: 'passthrough', command: detectedCmd };
    if (type === 'passthrough')
        return { widget: 'passthrough', command: 'npx -y ccstatusline@latest' };
    if (type === 'custom') {
        const command = await p.text({ message: m.commandPrompt, placeholder: '~/my-script.sh' });
        bail(command);
        return { widget: 'passthrough', command: command };
    }
    const interval = async () => {
        const v = await p.select({
            message: m.secondsPerItem,
            options: [5, 10, 15, 20, 30].map(n => ({ value: String(n), label: `${n}s` })),
            initialValue: '10',
        });
        bail(v);
        return Number(v);
    };
    if (type === 'news') {
        const sources = await p.multiselect({
            message: m.newsSources,
            options: Object.keys(NEWS_SOURCES).map(s => ({ value: s, label: s })),
            initialValues: Object.keys(NEWS_SOURCES),
        });
        bail(sources);
        return { widget: 'news', sources: sources, interval: await interval() };
    }
    if (type === 'soccer') {
        const sources = await p.multiselect({
            message: m.soccerSources,
            options: Object.keys(SOCCER_SOURCES).map(s => ({ value: s, label: s })),
            initialValues: Object.keys(SOCCER_SOURCES),
        });
        bail(sources);
        return { widget: 'soccer', sources: sources, interval: await interval() };
    }
    return { widget: 'worldcup', interval: await interval() };
}
async function configureLine(lineNum, m, detected) {
    p.log.step(m.line(lineNum));
    const soloOptions = [];
    if (detected) {
        soloOptions.push({ value: 'ccstatusline', label: detected.name, hint: m.soloHintDetected });
    }
    else {
        soloOptions.push({ value: 'passthrough', label: 'ccstatusline', hint: m.soloHintCcsl });
    }
    soloOptions.push({ value: 'custom', label: m.customCommand, hint: m.soloHintCustom });
    const contentOptions = [
        { value: 'news', label: m.wNews },
        { value: 'soccer', label: m.wSoccer },
        { value: 'worldcup', label: m.wWorldcup },
    ];
    const firstType = await p.select({
        message: m.whatGoesHere,
        options: [...soloOptions, ...contentOptions],
    });
    bail(firstType);
    // solo widgets — can't combine
    if (['ccstatusline', 'passthrough', 'custom'].includes(firstType)) {
        return [await configureWidget(firstType, m, detected?.command ?? null)];
    }
    // content widgets — can combine more
    const widgets = [await configureWidget(firstType, m, null)];
    while (true) {
        const more = await p.confirm({ message: m.addAnotherWidget, initialValue: false });
        bail(more);
        if (!more)
            break;
        const remaining = contentOptions.filter(o => !widgets.find(w => w.widget === o.value));
        if (!remaining.length) {
            p.log.warn(m.noMoreWidgets);
            break;
        }
        const next = await p.select({ message: m.widget, options: remaining });
        bail(next);
        widgets.push(await configureWidget(next, m, null));
    }
    return widgets;
}
export async function configureLines(m, detected) {
    const numStr = await p.text({ message: m.howManyLines, initialValue: '3' });
    bail(numStr);
    const num = Math.max(1, Number(numStr));
    const lines = [];
    for (let i = 0; i < num; i++)
        lines.push(await configureLine(i + 1, m, detected));
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
        if (action === 'confirm')
            break;
        lines[Number(action)] = await configureLine(Number(action) + 1, m, detected);
    }
    return lines;
}
