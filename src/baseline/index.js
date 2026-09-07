/**
 * Strudel Upstream Baseline: Core Evaluation Engine
 * Offline-first pattern evaluation and deterministic event scheduler.
 */

const miniNotation = require('./mini-notation');
const transpiler = require('./transpiler');

function flattenEvents(node, start = 0, duration = 1) {
  const events = [];

  if (node.type === 'Sequence' || node.type === 'Subdivision') {
    const total = node.children.length;
    if (total === 0) return events;
    const stepDuration = duration / total;

    for (let i = 0; i < total; i++) {
      const childStart = start + (i * stepDuration);
      events.push(...flattenEvents(node.children[i], childStart, stepDuration));
    }
  } else if (node.type === 'Atom') {
    if (node.value !== '~') { // '~' is rest in TidalCycles
      events.push({
        time: Number(start.toFixed(4)),
        duration: Number(duration.toFixed(4)),
        value: node.value
      });
    }
  } else if (node.type === 'ModifiedAtom') {
    const factor = node.factor || 1;
    const subDuration = duration / factor;
    for (let f = 0; f < factor; f++) {
      const subStart = start + (f * subDuration);
      events.push({
        time: Number(subStart.toFixed(4)),
        duration: Number(subDuration.toFixed(4)),
        value: node.child.value
      });
    }
  }

  return events;
}

function dryRun(patternInput, cycles = 1) {
  const graph = transpiler.transpile(patternInput);
  const baseEvents = flattenEvents(graph.ast, 0, 1);
  const totalEvents = [];

  for (let c = 0; c < cycles; c++) {
    for (const ev of baseEvents) {
      totalEvents.push({
        cycle: c,
        time: Number((c + ev.time).toFixed(4)),
        duration: ev.duration,
        value: ev.value
      });
    }
  }

  return totalEvents;
}

module.exports = {
  version: '1.1.0-offline',
  miniNotation,
  transpiler,
  dryRun
};
