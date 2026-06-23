import { loadConfig, saveConfig, resolveProfileName, useProfile } from '../config.js';

// `claudebar profile`            → list profiles, marking the active one
// `claudebar profile use <name>` → switch (holds until the next scheduled switch)
// `claudebar profile current`    → print the profile resolved right now
export function profile(args: string[]): void {
  const config = loadConfig();
  if (!config) { console.log('claudebar: not configured. Run: claudebar init'); return; }

  const sub = args[0] ?? 'list';
  const names = Object.keys(config.profiles);
  const current = resolveProfileName(config);

  if (sub === 'current') { console.log(current); return; }

  if (sub === 'use') {
    const name = args[1];
    if (!name) { console.log('Usage: claudebar profile use <name>'); process.exit(1); }
    if (!config.profiles[name]) {
      console.log(`Unknown profile "${name}". Available: ${names.join(', ')}`);
      process.exit(1);
    }
    useProfile(config, name);
    saveConfig(config);
    const next = config.override ? new Date(config.override.until) : null;
    const hold = next
      ? ` (until ${String(next.getHours()).padStart(2,'0')}:${String(next.getMinutes()).padStart(2,'0')})`
      : '';
    console.log(`Switched to "${name}"${hold}.`);
    return;
  }

  // list
  console.log('Profiles:');
  for (const n of names) {
    const mark = n === current ? '●' : '○';
    const lines = config.profiles[n].length;
    console.log(`  ${mark} ${n}  (${lines} line${lines === 1 ? '' : 's'})`);
  }
  if (config.switches?.length) {
    console.log('\nScheduled switches:');
    for (const s of [...config.switches].sort((a, b) => a.at.localeCompare(b.at))) {
      console.log(`  ${s.at} → ${s.profile}`);
    }
  }
}
