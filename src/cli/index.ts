#!/usr/bin/env node
import { run } from '../runner.js';
import { init } from './init.js';
import { profile } from './profile.js';

const cmd = process.argv[2];

switch (cmd) {
  case 'run':
    run().catch(e => { console.error(e); process.exit(1); });
    break;

  case 'init':
    init().catch(e => { console.error(e); process.exit(1); });
    break;

  case 'profile':
    profile(process.argv.slice(3));
    break;

  default:
    console.log(`claudebar <command>

  init               Interactive setup
  run                Render and print the status bar lines
  profile            List profiles (marks the active one)
  profile use <name> Switch profile (holds until the next scheduled switch)
`);
}
