import type { Lang } from './types.js';

// ─── CLI messages ─────────────────────────────────────────────────────────────

export interface Messages {
  intro: string;
  overwrite: string;
  cancelled: string;
  detected: (name: string) => string;
  defaultSection: string;
  howManyLines: string;
  line: (n: number) => string;
  whatGoesHere: string;
  soloHintDetected: string;
  soloHintCcsl: string;
  soloHintCustom: string;
  customCommand: string;
  commandPrompt: string;
  addAnotherWidget: string;
  noMoreWidgets: string;
  widget: string;
  newsSources: string;
  soccerSources: string;
  secondsPerItem: string;
  wNews: string;
  wSoccer: string;
  wWorldcup: string;
  summary: string;
  whatToDo: string;
  confirm: string;
  reconfigureLine: (n: number) => string;
  profilesSection: string;
  profileName: string;
  configureProfile: (name: string) => string;
  addAnotherProfile: string;
  chooseActive: string;
  setupSwitching: string;
  switchAt: string;
  switchToProfile: string;
  addAnotherSwitch: string;
  updateSettings: string;
  done: string;
  empty: string;
  labelNews: (sources: string) => string;
  labelSoccer: (sources: string) => string;
  labelWorldcup: string;
  presets: { work: string; morning: string; afternoon: string; evening: string; night: string; custom: string };
}

const en: Messages = {
  intro: 'claudebar — status bar compositor',
  overwrite: 'Config already exists. Overwrite?',
  cancelled: 'Cancelled.',
  detected: (name) => `Detected: ${name}`,
  defaultSection: '── Default configuration ──',
  howManyLines: 'How many lines?',
  line: (n) => `Line ${n}`,
  whatGoesHere: 'What goes on this line?',
  soloHintDetected: 'detected — solo',
  soloHintCcsl: 'npx -y ccstatusline@latest — solo',
  soloHintCustom: 'solo',
  customCommand: 'Custom command',
  commandPrompt: 'Command:',
  addAnotherWidget: 'Add another widget to this line?',
  noMoreWidgets: 'No more widgets available.',
  widget: 'Widget:',
  newsSources: 'News sources (space toggles, a = all, enter confirms):',
  soccerSources: 'Football sources (space toggles, a = all, enter confirms):',
  secondsPerItem: 'Seconds per item:',
  wNews: 'News (RSS)',
  wSoccer: 'Football News',
  wWorldcup: 'World Cup scores',
  summary: 'Lines summary:',
  whatToDo: 'What would you like to do?',
  confirm: 'Confirm',
  reconfigureLine: (n) => `Reconfigure line ${n}`,
  profilesSection: '── Profiles (named sets of lines) ──',
  profileName: 'Profile name:',
  configureProfile: (name) => `Profile "${name}"`,
  addAnotherProfile: 'Add another profile?',
  chooseActive: 'Which profile is active by default?',
  setupSwitching: 'Switch profiles automatically by time of day?',
  switchAt: 'Switch at:',
  switchToProfile: 'Switch to which profile?',
  addAnotherSwitch: 'Add another switch?',
  updateSettings: 'Update ~/.claude/settings.json?',
  done: 'Done!  Config: ~/.claudebar/config.json  |  Try: claudebar run',
  empty: '(empty)',
  labelNews: (s) => `News (${s})`,
  labelSoccer: (s) => `Football (${s})`,
  labelWorldcup: 'World Cup',
  presets: { work: 'Work day', morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Late night', custom: 'Custom…' },
};

const pt: Messages = {
  intro: 'claudebar — compositor de status bar',
  overwrite: 'Configuração já existe. Sobrescrever?',
  cancelled: 'Cancelado.',
  detected: (name) => `Detectado: ${name}`,
  defaultSection: '── Configuração padrão ──',
  howManyLines: 'Quantas linhas?',
  line: (n) => `Linha ${n}`,
  whatGoesHere: 'O que vai nessa linha?',
  soloHintDetected: 'detectado — sozinho',
  soloHintCcsl: 'npx -y ccstatusline@latest — sozinho',
  soloHintCustom: 'sozinho',
  customCommand: 'Comando customizado',
  commandPrompt: 'Comando:',
  addAnotherWidget: 'Adicionar outro widget nessa linha?',
  noMoreWidgets: 'Não há mais widgets disponíveis.',
  widget: 'Widget:',
  newsSources: 'Fontes de notícias (espaço marca/desmarca, a = todas, enter confirma):',
  soccerSources: 'Fontes de futebol (espaço marca/desmarca, a = todas, enter confirma):',
  secondsPerItem: 'Segundos por item:',
  wNews: 'Notícias (RSS)',
  wSoccer: 'Notícias de Futebol',
  wWorldcup: 'Placar Copa do Mundo',
  summary: 'Resumo das linhas:',
  whatToDo: 'O que deseja fazer?',
  confirm: 'Confirmar',
  reconfigureLine: (n) => `Reconfigurar linha ${n}`,
  profilesSection: '── Profiles (conjuntos de linhas nomeados) ──',
  profileName: 'Nome do profile:',
  configureProfile: (name) => `Profile "${name}"`,
  addAnotherProfile: 'Adicionar outro profile?',
  chooseActive: 'Qual profile fica ativo por padrão?',
  setupSwitching: 'Trocar de profile automaticamente por horário?',
  switchAt: 'Trocar às:',
  switchToProfile: 'Trocar para qual profile?',
  addAnotherSwitch: 'Adicionar outra troca?',
  updateSettings: 'Atualizar ~/.claude/settings.json?',
  done: 'Pronto!  Config: ~/.claudebar/config.json  |  Teste: claudebar run',
  empty: '(vazia)',
  labelNews: (s) => `Notícias (${s})`,
  labelSoccer: (s) => `Futebol (${s})`,
  labelWorldcup: 'Copa do Mundo',
  presets: { work: 'Dia de trabalho', morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite', night: 'Madrugada', custom: 'Personalizado…' },
};

export function messages(lang: Lang): Messages {
  return lang === 'pt' ? pt : en;
}

// ─── World Cup widget labels ──────────────────────────────────────────────────

export interface WorldCupLabels {
  live: string;
  ft: string;
  upcoming: string;
  cup: string;
  none: string;
  half: string;
  extra: string;
  pen: string;
  weekdays: string[];
}

const wcEn: WorldCupLabels = {
  live: 'LIVE', ft: 'FT', upcoming: 'Upcoming', cup: 'World Cup',
  none: 'World Cup 2026: no matches scheduled',
  half: 'Half-time', extra: 'Extra Time', pen: 'Penalties',
  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const wcPt: WorldCupLabels = {
  live: 'AO VIVO', ft: 'FIM', upcoming: 'Próximos', cup: 'Copa',
  none: 'Copa 2026: sem jogos agendados',
  half: 'Intervalo', extra: 'Prorr.', pen: 'Pênaltis',
  weekdays: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
};

export function worldCupLabels(lang: Lang): WorldCupLabels {
  return lang === 'pt' ? wcPt : wcEn;
}
