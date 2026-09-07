/**
 * Strudel Local Modular Extensibility Layer: Registry
 * Manages custom synths, syntax transformers, visualizers, and evaluation hooks
 * completely decoupled from the upstream baseline.
 */

class ExtensionRegistry {
  constructor() {
    this.synths = new Map();
    this.syntaxRules = new Map();
    this.visualizers = new Map();
    this.evaluateHooks = [];
    this.initHooks = [];
  }

  registerSynth(name, synthFactory) {
    if (typeof name !== 'string' || typeof synthFactory !== 'function') {
      throw new Error('Synth registration requires a string name and factory function');
    }
    this.synths.set(name, synthFactory);
    return this;
  }

  getSynth(name) {
    return this.synths.get(name);
  }

  hasSynth(name) {
    return this.synths.has(name);
  }

  registerSyntax(name, transformer) {
    this.syntaxRules.set(name, transformer);
    return this;
  }

  registerVisualizer(name, visualizer) {
    this.visualizers.set(name, visualizer);
    return this;
  }

  onEvaluate(hookFn) {
    this.evaluateHooks.push(hookFn);
  }

  onInit(hookFn) {
    this.initHooks.push(hookFn);
  }

  applyEvaluateHooks(code) {
    let transformed = code;
    for (const hook of this.evaluateHooks) {
      transformed = hook(transformed) || transformed;
    }
    return transformed;
  }

  initialize() {
    for (const hook of this.initHooks) {
      hook(this);
    }
  }

  listCapabilities() {
    return {
      synths: Array.from(this.synths.keys()),
      syntaxRules: Array.from(this.syntaxRules.keys()),
      visualizers: Array.from(this.visualizers.keys())
    };
  }
}

const globalRegistry = new ExtensionRegistry();

module.exports = globalRegistry;
