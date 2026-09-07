/**
 * Swirl - Ambient Type Definitions for IDE IntelliSense
 * Provides out-of-the-box autocomplete when typing '.' in .js and .strudel files.
 */

declare interface SwirlPattern {
  /** Speed up the pattern playback by a multiplier factor (e.g. .fast(2)) */
  fast(factor: number | string | SwirlPattern): SwirlPattern;
  /** Slow down the pattern playback by a factor (e.g. .slow(2)) */
  slow(factor: number | string | SwirlPattern): SwirlPattern;
  /** Speed up playback while pitch-shifting upwards proportionally (like tape hurry) */
  hurry(factor: number | string | SwirlPattern): SwirlPattern;
  
  /** Select sample bank (e.g. 'tr909', 'tr808', 'linn', 'casio', 'akaimpc', etc.) */
  bank(name: string | SwirlPattern): SwirlPattern;
  /** Set sound amplitude / volume gain (0.0 to 1.0+) */
  gain(amount: number | string | SwirlPattern): SwirlPattern;
  /** Set stereo panning (0.0 = left, 0.5 = center, 1.0 = right) */
  pan(amount: number | string | SwirlPattern): SwirlPattern;
  
  /** Shift the pattern timing earlier in the cycle */
  early(amount: number | string | SwirlPattern): SwirlPattern;
  /** Shift the pattern timing later in the cycle */
  late(amount: number | string | SwirlPattern): SwirlPattern;

  /** ADSR envelope: Attack time in seconds */
  attack(seconds: number | string | SwirlPattern): SwirlPattern;
  /** ADSR envelope: Decay time in seconds */
  decay(seconds: number | string | SwirlPattern): SwirlPattern;
  /** ADSR envelope: Sustain level (0.0 to 1.0) */
  sustain(level: number | string | SwirlPattern): SwirlPattern;
  /** ADSR envelope: Release time in seconds */
  release(seconds: number | string | SwirlPattern): SwirlPattern;
  /** Note duration relative to step duration (e.g. 0.5 = staccato, 1.0 = full, 2.0 = overlap) */
  legato(amount: number | string | SwirlPattern): SwirlPattern;
  /** Audio slice / sample truncation duration in seconds */
  clip(amount: number | string | SwirlPattern): SwirlPattern;

  /** Reverb send amount / room mix (0.0 to 1.0) */
  room(amount: number | string | SwirlPattern): SwirlPattern;
  /** Reverb room size / dimension (0.0 to 1.0) */
  size(amount: number | string | SwirlPattern): SwirlPattern;
  /** Echo / delay send amount (0.0 to 1.0) */
  delay(amount: number | string | SwirlPattern): SwirlPattern;
  /** Echo delay time in seconds / cycle fraction */
  delaytime(seconds: number | string | SwirlPattern): SwirlPattern;
  /** Echo feedback regeneration ratio (0.0 to 0.99) */
  delayfeedback(amount: number | string | SwirlPattern): SwirlPattern;

  /** Low-pass filter cutoff frequency in Hz (e.g. 800, 2000) */
  lpf(frequency: number | string | SwirlPattern): SwirlPattern;
  /** Low-pass filter resonance / Q */
  lpq(resonance: number | string | SwirlPattern): SwirlPattern;
  /** High-pass filter cutoff frequency in Hz */
  hpf(frequency: number | string | SwirlPattern): SwirlPattern;
  /** High-pass filter resonance / Q */
  hpq(resonance: number | string | SwirlPattern): SwirlPattern;
  /** Band-pass filter cutoff frequency in Hz */
  bpf(frequency: number | string | SwirlPattern): SwirlPattern;
  /** Band-pass filter resonance / Q */
  bpq(resonance: number | string | SwirlPattern): SwirlPattern;
  /** Formant vowel filter ('a', 'e', 'i', 'o', 'u') */
  vowel(vowel: string | SwirlPattern): SwirlPattern;

  /** Bitcrusher bit depth reduction (e.g. 4, 8, 12) */
  crush(bits: number | string | SwirlPattern): SwirlPattern;
  /** Sample rate coarse downsampling divisor */
  coarse(factor: number | string | SwirlPattern): SwirlPattern;
  /** Waveshaping distortion amount (0.0 to 1.0) */
  shape(amount: number | string | SwirlPattern): SwirlPattern;
  /** Overdrive / distortion drive */
  distort(amount: number | string | SwirlPattern): SwirlPattern;

  /** Pitch transposition in semitones (e.g. +7, -12) */
  transpose(semitones: number | string | SwirlPattern): SwirlPattern;
  /** Map pattern pitch integers to a musical scale (e.g. 'minor', 'major', 'dorian', 'pentatonic') */
  scale(scaleName: string | SwirlPattern): SwirlPattern;
  /** Apply chord voicing to chord symbols */
  voicing(voicingName?: string): SwirlPattern;
  /** Set root pitch for scales and chords */
  root(rootPitch: string | SwirlPattern): SwirlPattern;

  /** Cut group / choke channel: sounds in same cut group truncate each other */
  cut(group: number | string): SwirlPattern;
  /** Send pattern to a dedicated effect orbit bus (0, 1, 2, ...) */
  orbit(orbitIndex: number | string): SwirlPattern;

  /** Repeat each event in the pattern n times per step */
  ply(times: number | string | SwirlPattern): SwirlPattern;
  /** Slice each sample event into n equal granular chops */
  chop(parts: number | string | SwirlPattern): SwirlPattern;
  /** Slice sample across multiple cycles */
  striate(parts: number | string | SwirlPattern): SwirlPattern;
  /** Reverse the pattern playback within each cycle */
  rev(): SwirlPattern;
  /** Alternate playing the pattern forward in one cycle and reversed in the next */
  palindrome(): SwirlPattern;

  /** Juxtapose: play the original pattern on the left channel and a transformed copy on the right */
  jux(transformFn: (pattern: SwirlPattern) => SwirlPattern): SwirlPattern;
  /** Layer a transformed copy of the pattern on top of the original */
  superimpose(transformFn: (pattern: SwirlPattern) => SwirlPattern): SwirlPattern;
  /** Randomly drop 50% of events */
  degrade(): SwirlPattern;
  /** Randomly drop events with a given probability (0.0 = never drop, 1.0 = drop all) */
  degradeBy(probability: number | string | SwirlPattern): SwirlPattern;
  /** Apply rhythmic structure mask from a mini-notation pattern */
  struct(structurePattern: string | SwirlPattern): SwirlPattern;
  /** Mask events based on a boolean or mini-notation pattern */
  mask(maskPattern: string | SwirlPattern): SwirlPattern;

  /** Assign display color for visualizer canvas / highlights */
  color(colorString: string | SwirlPattern): SwirlPattern;
  /** Print active haps and pattern events to console */
  log(): SwirlPattern;
}

// Backward-compatibility alias
declare type StrudelPattern = SwirlPattern;

/**
 * Creates a sound sample pattern using mini-notation.
 * @param miniNotation Mini-notation pattern string, e.g. s("bd [sd hh]*2")
 */
declare function s(miniNotation: string | any): SwirlPattern;

/**
 * Alias for s(). Creates a sound sample pattern using mini-notation.
 */
declare function sound(miniNotation: string | any): SwirlPattern;

/**
 * Creates a pitch / note pattern using musical note notation.
 * @param miniNotation Note pattern string, e.g. note("c3 [e3 g3]")
 */
declare function note(miniNotation: string | any): SwirlPattern;

/**
 * Alias for note() or sample index pattern.
 */
declare function n(miniNotation: string | any): SwirlPattern;

/**
 * Creates a chord pattern using chord symbols, e.g. chord("<Cm7 F7 Bbmaj7>")
 */
declare function chord(miniNotation: string | any): SwirlPattern;

/**
 * Stack multiple patterns to play concurrently in parallel.
 */
declare function stack(...patterns: (SwirlPattern | string)[]): SwirlPattern;

/**
 * Concatenate multiple patterns sequentially, playing each for one cycle.
 */
declare function cat(...patterns: (SwirlPattern | string)[]): SwirlPattern;

/**
 * Alias for cat().
 */
declare function slowcat(...patterns: (SwirlPattern | string)[]): SwirlPattern;

/**
 * Sequence patterns according to an arrangement or structure.
 */
declare function sequence(...patterns: (SwirlPattern | string)[]): SwirlPattern;

/**
 * Arrange musical patterns across cycle sections.
 */
declare function arrange(...patterns: any[]): SwirlPattern;

/**
 * Creates a constant single-value pattern.
 */
declare function pure(value: any): SwirlPattern;

/**
 * Silence pattern (plays nothing).
 */
declare const silence: SwirlPattern;

/**
 * Set Cycles Per Second (tempo).
 * @param cps Cycles per second (e.g. 0.5 = 120 BPM in 4/4)
 */
declare function setcps(cps: number): void;

/**
 * Set Beats Per Minute (tempo helper).
 * @param bpm Beats per minute (e.g. bpm(130))
 */
declare function bpm(bpm: number): void;

/**
 * Stop all active patterns and halt audio playback immediately.
 */
declare function hush(): void;

/**
 * Load external or custom sample maps.
 */
declare function samples(sampleMap: string | object): Promise<void>;
