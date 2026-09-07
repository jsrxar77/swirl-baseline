/**
 * Unit Test Script: Strudel REPL & Engine (Headless CLI)
 * Verifies AST generation, mini-notation tokenization, and pattern scheduler.
 */

const assert = require('assert');
const path = require('path');

const miniNotation = require('../src/baseline/mini-notation');
const transpiler = require('../src/baseline/transpiler');
const baseline = require('../src/baseline/index');
const registry = require('../src/plugins/registry');

console.log('[TEST:REPL] Starting headless Strudel engine tests...');

// Test 1: Mini-notation basic parsing
console.log('[TEST:REPL] 1. Testing mini-notation parser...');
const ast1 = miniNotation.parse('bd sd hh cp');
assert.strictEqual(ast1.type, 'Sequence');
assert.strictEqual(ast1.children.length, 4);
assert.strictEqual(ast1.children[0].value, 'bd');
console.log('  PASS: Basic sequence parsing succeeded.');

// Test 2: Sub-sequence / polyrhythm parsing
console.log('[TEST:REPL] 2. Testing polyrhythmic subdivisions...');
const ast2 = miniNotation.parse('bd [sd hh] cp');
assert.strictEqual(ast2.children.length, 3);
assert.strictEqual(ast2.children[1].type, 'Subdivision');
assert.strictEqual(ast2.children[1].children.length, 2);
console.log('  PASS: Subdivision parsing succeeded.');

// Test 3: Transpiler evaluation
console.log('[TEST:REPL] 3. Testing transpiler logic...');
const transpiled = transpiler.transpile('s("bd [sd hh]")');
assert.strictEqual(typeof transpiled, 'object');
assert.strictEqual(transpiled.operator, 's');
console.log('  PASS: Transpiler generated functional pattern object.');

// Test 4: Pattern dry-run event calculation
console.log('[TEST:REPL] 4. Testing temporal pattern simulation...');
const events = baseline.dryRun('bd [sd hh]', 1);
assert(Array.isArray(events));
assert(events.length >= 3);
console.log(`  PASS: Dry-run generated ${events.length} deterministic temporal events.`);

// Test 5: Modular Plugins registry
console.log('[TEST:REPL] 5. Testing modular plugins registry...');
registry.registerSynth('test_synth', (time, note) => ({ time, note, synth: 'test' }));
assert(registry.hasSynth('test_synth'));
console.log('  PASS: Modular plugins registry functions decoupled from baseline.');

console.log('[TEST:REPL] All tests completed successfully (5/5 passing).');
process.exit(0);
