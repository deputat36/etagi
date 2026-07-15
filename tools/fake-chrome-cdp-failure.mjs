#!/usr/bin/env node

const args = process.argv.slice(2);

if(args.includes('--version')){
  console.log('Fake Chrome CDP failure injector 1.0');
  process.exit(0);
}

process.stderr.write('fault injection: fake Chrome exits before the CDP response\n');
setTimeout(() => process.exit(86), 25);
