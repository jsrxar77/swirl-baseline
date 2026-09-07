/**
 * Modular Extension: Sample Synth Plugin
 * Demonstrates how to register custom synth nodes and pre-evaluation syntax hooks
 * completely decoupled from the upstream Strudel baseline.
 */

module.exports = {
  name: 'sample-synth',
  version: '1.0.0',
  register(registry) {
    // 1. Register custom Web Audio oscillator factory
    registry.registerSynth('subtractive_lead', (audioContext, destination) => {
      return {
        trigger(frequency, time, duration) {
          if (!audioContext || audioContext.state === 'suspended') return;
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(frequency, time);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1200, time);

          gain.gain.setValueAtTime(0.3, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(destination || audioContext.destination);

          osc.start(time);
          osc.stop(time + duration);
        }
      };
    });

    // 2. Register custom syntax transform hook
    registry.registerSyntax('sublead_alias', (inputCode) => {
      // Replaces sublead("...") with sound("subtractive_lead:...")
      return inputCode.replace(/sublead\((.*?)\)/g, 's("subtractive_lead").note($1)');
    });

    // 3. Register evaluation lifecycle hook
    registry.onEvaluate((code) => {
      // Intercept code before evaluation
      return code;
    });
  }
};
