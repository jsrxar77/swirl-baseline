/**
 * Upstream Strudel Content Synchronization Script
 * Extracts, sanitizes, and persists Reference, Sounds, and Patterns catalogs to src/data/.
 *
 * Governance:
 * - REGLA DE ORO 3: Cero emojis permitidos.
 * - REGLA DE ORO 9: Los catalogos generados deben ser 100% locales y offline.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const INDEX_URL = 'https://strudel.cc/_astro/index.BF19ZmMS.js';
const PATTERNS_URL = 'https://strudel.cc/_astro/PatternsTab.DvIj4Vk2.js';

// Regex to strip all emojis and non-standard unicode pictorial characters
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]/gu;

function sanitizeText(str) {
  if (typeof str !== 'string') return str;
  return str.replace(EMOJI_REGEX, '').trim();
}

function sanitizeObject(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') return sanitizeText(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = sanitizeObject(v);
    }
    return res;
  }
  return obj;
}

async function fetchUpstreamText(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`[SYNC:NOTICE] Upstream fetch warning for ${url}: ${err.message}`);
    return null;
  }
}

function extractDocsFromBundle(bundleText) {
  if (!bundleText) return null;
  const parseIdx = bundleText.indexOf('JSON.parse(`[{"comment":"/**\\');
  if (parseIdx === -1) return null;
  const endMarker = '/workspace/uzu/strudel/packages/xen/xen.mjs"]}]`)';
  const endIdx = bundleText.indexOf(endMarker, parseIdx);
  if (endIdx === -1) return null;

  const rawSlice = bundleText.slice(parseIdx, endIdx + endMarker.length);
  try {
    const parsed = eval(rawSlice);
    if (!Array.isArray(parsed)) return null;

    // Filter and normalize following Strudel reference standards
    const seenNames = new Set();
    const referenceList = [];

    const isIncluded = (doc) => {
      const name = doc.name;
      const desc = doc.description;
      const tags = (doc.tags || []).map(t => typeof t === 'string' ? t : t.value || t.text).filter(Boolean);
      const isSupradough = tags.includes('supradough') && !tags.includes('superdough');
      const isSuperdirt = tags.includes('superdirt') && !tags.includes('superdough');
      return name && !name.startsWith('_') && !!desc && !isSupradough && !isSuperdirt;
    };

    for (const item of parsed) {
      if (!isIncluded(item) || seenNames.has(item.name)) continue;

      const rawTags = (item.tags || []).map(t => typeof t === 'string' ? t : t.value || t.text).filter(Boolean);
      const tags = rawTags.length > 0 ? rawTags : ['general'];
      const synonyms = (item.synonyms || []).filter(Boolean);

      seenNames.add(item.name);
      for (const s of synonyms) {
        if (!seenNames.has(s)) seenNames.add(s);
      }

      // Clean HTML tags from description for readable markdown preview
      let cleanDesc = item.description || '';
      cleanDesc = cleanDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // Extract parameters
      const params = (item.params || []).map(p => ({
        name: p.name || '',
        type: p.type?.names ? p.type.names.join('|') : (p.type || 'any'),
        description: (p.description || '').replace(/<[^>]+>/g, '').trim(),
        optional: !!p.optional,
        defaultvalue: p.defaultvalue !== undefined ? String(p.defaultvalue) : undefined
      }));

      // Extract examples
      const examples = (item.examples || []).map(ex => ex.trim()).filter(Boolean);

      referenceList.push({
        name: item.name,
        category: tags[0] || 'general',
        tags: tags,
        synonyms: synonyms,
        description: cleanDesc,
        rawDescription: item.description || '',
        params: params,
        returns: item.returns ? item.returns.map(r => r.type?.names ? r.type.names.join('|') : 'any').join('|') : 'Pattern',
        examples: examples
      });
    }

    return referenceList;
  } catch (err) {
    console.warn(`[SYNC:NOTICE] Failed to parse docs from bundle slice: ${err.message}`);
    return null;
  }
}

function extractPatternsFromBundle(bundleText) {
  if (!bundleText) return null;
  const re = /`(\/\/[^`]+)`/g;
  const matches = [...bundleText.matchAll(re)];
  if (matches.length === 0) return null;

  const patterns = [];
  const seenTitles = new Set();

  for (let i = 0; i < matches.length; i++) {
    const rawCode = matches[i][1];
    const lines = rawCode.split('\n');
    let title = `Pattern ${i + 1}`;
    let author = 'Strudel Community';
    let tags = ['live-coding'];

    for (const line of lines.slice(0, 8)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') && !trimmed.startsWith('// @') && !trimmed.startsWith('// http')) {
        const candidate = trimmed.replace(/^\/\/\s*/, '').replace(/["']/g, '').trim();
        if (candidate.length > 2 && !candidate.includes('(') && !candidate.includes('=')) {
          title = candidate;
        }
      }
      if (trimmed.includes('@by')) {
        author = trimmed.split('@by')[1].trim();
      }
      if (trimmed.includes('@license')) {
        // preserve attribution
      }
    }

    if (seenTitles.has(title)) continue;
    seenTitles.add(title);

    // Classify category based on pattern content
    if (/drum|beat|amensister|bd|sd|hh|break/i.test(rawCode)) tags.push('drums');
    if (/bass|fuge/i.test(rawCode)) tags.push('bass');
    if (/piano|chords|giant steps|swimming/i.test(rawCode)) tags.push('harmonic');
    if (/synth|rave|blippy|bells|arpoon/i.test(rawCode)) tags.push('synth');
    if (/ambient|drone|sub/i.test(rawCode)) tags.push('ambient');

    patterns.push({
      id: `pattern-${patterns.length + 1}`,
      title: title,
      author: author,
      tags: [...new Set(tags)],
      code: rawCode.trim()
    });
  }

  return patterns;
}

function buildDefaultSoundsCatalog() {
  return {
    drumMachines: [
      { id: 'tr909', name: 'Roland TR-909', category: 'drum-machines', voices: ['bd', 'sd', 'lt', 'mt', 'ht', 'cp', 'rs', 'hh', 'oh', 'cr', 'rd'] },
      { id: 'tr808', name: 'Roland TR-808', category: 'drum-machines', voices: ['bd', 'sd', 'lt', 'mt', 'ht', 'cp', 'rs', 'cb', 'hh', 'oh', 'cy', 'cl'] },
      { id: 'tr707', name: 'Roland TR-707', category: 'drum-machines', voices: ['bd', 'sd', 'lt', 'mt', 'ht', 'cp', 'rs', 'cb', 'hh', 'oh', 'cr', 'rd'] },
      { id: 'tr606', name: 'Roland TR-606', category: 'drum-machines', voices: ['bd', 'sd', 'lt', 'ht', 'hh', 'oh', 'cy'] },
      { id: 'linndrum', name: 'Linn LM-2 LinnDrum', category: 'drum-machines', voices: ['bd', 'sd', 'snare', 'hihat', 'openhh', 'tom', 'conga', 'cowbell', 'clap', 'tamb'] },
      { id: 'cr78', name: 'Roland CompuRhythm CR-78', category: 'drum-machines', voices: ['bd', 'sd', 'rim', 'cowbell', 'hihat', 'guiro', 'tambourine', 'bongo'] },
      { id: 'oberheimdx', name: 'Oberheim DMX', category: 'drum-machines', voices: ['bd', 'sd', 'tom', 'hh', 'oh', 'cr', 'rd', 'cp', 'rim'] },
      { id: 'korgkr55', name: 'Korg KR-55', category: 'drum-machines', voices: ['bd', 'sd', 'hh', 'oh', 'cy', 'conga', 'clave', 'cowbell'] },
      { id: 'alesishr16', name: 'Alesis HR-16', category: 'drum-machines', voices: ['bd', 'sd', 'tom', 'hh', 'oh', 'cr', 'cp', 'perc'] },
      { id: 'casiorz1', name: 'Casio RZ-1', category: 'drum-machines', voices: ['bd', 'sd', 'tom1', 'tom2', 'tom3', 'rim', 'clap', 'hh', 'oh', 'crash', 'ride'] },
      { id: 'emusp12', name: 'E-mu SP-1200', category: 'drum-machines', voices: ['bd', 'sd', 'rim', 'hh', 'oh', 'tom', 'clap', 'crash', 'ride'] },
      { id: 'yamahary30', name: 'Yamaha RY30', category: 'drum-machines', voices: ['bd', 'sd', 'tom', 'hh', 'oh', 'ride', 'crash', 'perc'] }
    ],
    synths: [
      { id: 'synth', name: 'Strudel Default Synth', category: 'synth', type: 'web-audio', params: ['cutoff', 'resonance', 'attack', 'decay', 'sustain', 'release'] },
      { id: 'sine', name: 'Sine Wave Oscillator', category: 'oscillator', type: 'web-audio', waveform: 'sine' },
      { id: 'sawtooth', name: 'Sawtooth Oscillator', category: 'oscillator', type: 'web-audio', waveform: 'sawtooth' },
      { id: 'square', name: 'Square Wave Oscillator', category: 'oscillator', type: 'web-audio', waveform: 'square' },
      { id: 'triangle', name: 'Triangle Wave Oscillator', category: 'oscillator', type: 'web-audio', waveform: 'triangle' },
      { id: 'supersaw', name: 'Supersaw Multi-Oscillator', category: 'synth', type: 'web-audio', params: ['detune', 'voices'] },
      { id: 'tone', name: 'Simple Tone Generator', category: 'synth', type: 'web-audio', waveform: 'triangle' },
      { id: 'noise', name: 'White / Pink Noise Generator', category: 'noise', type: 'web-audio' },
      { id: 'pluck', name: 'Karplus-Strong Plucked String', category: 'physical-modeling', type: 'web-audio', params: ['decay', 'dampen'] },
      { id: 'fmsynth', name: '2-Operator FM Synthesizer', category: 'fm', type: 'web-audio', params: ['modIndex', 'modRatio'] }
    ],
    soundfonts: [
      { id: 'acoustic_grand_piano', name: 'Acoustic Grand Piano', program: 0, category: 'keyboard' },
      { id: 'bright_acoustic_piano', name: 'Bright Acoustic Piano', program: 1, category: 'keyboard' },
      { id: 'electric_grand_piano', name: 'Electric Grand Piano', program: 2, category: 'keyboard' },
      { id: 'electric_piano_1', name: 'Rhodes Electric Piano', program: 4, category: 'keyboard' },
      { id: 'electric_piano_2', name: 'DX7 Electric Piano', program: 5, category: 'keyboard' },
      { id: 'harpsichord', name: 'Harpsichord', program: 6, category: 'keyboard' },
      { id: 'drawbar_organ', name: 'Drawbar Organ', program: 16, category: 'organ' },
      { id: 'church_organ', name: 'Church Pipe Organ', program: 19, category: 'organ' },
      { id: 'acoustic_guitar_nylon', name: 'Acoustic Guitar (Nylon)', program: 24, category: 'guitar' },
      { id: 'acoustic_guitar_steel', name: 'Acoustic Guitar (Steel)', program: 25, category: 'guitar' },
      { id: 'electric_guitar_clean', name: 'Electric Guitar Clean', program: 27, category: 'guitar' },
      { id: 'electric_guitar_overdrive', name: 'Overdriven Guitar', program: 29, category: 'guitar' },
      { id: 'acoustic_bass', name: 'Acoustic Upright Bass', program: 32, category: 'bass' },
      { id: 'electric_bass_finger', name: 'Electric Bass (Finger)', program: 33, category: 'bass' },
      { id: 'slap_bass_1', name: 'Slap Bass', program: 36, category: 'bass' },
      { id: 'synth_bass_1', name: 'Analog Synth Bass', program: 38, category: 'bass' },
      { id: 'string_ensemble_1', name: 'String Ensemble', program: 48, category: 'strings' },
      { id: 'synth_strings_1', name: 'Synth Strings', program: 50, category: 'strings' },
      { id: 'trumpet', name: 'Brass Trumpet', program: 56, category: 'brass' },
      { id: 'tenor_sax', name: 'Tenor Saxophone', program: 66, category: 'reed' },
      { id: 'flute', name: 'Orchestral Flute', program: 73, category: 'pipe' },
      { id: 'lead_1_square', name: 'Lead 1 (Square)', program: 80, category: 'synth-lead' },
      { id: 'lead_2_sawtooth', name: 'Lead 2 (Sawtooth)', program: 81, category: 'synth-lead' },
      { id: 'pad_1_new_age', name: 'Pad 1 (New Age Fantasia)', program: 88, category: 'synth-pad' },
      { id: 'pad_2_warm', name: 'Pad 2 (Warm Analog)', program: 89, category: 'synth-pad' }
    ],
    sampleKits: [
      { id: 'bd', name: 'Bass Drum / Kick (bd:0 .. bd:10)', category: 'percussion', count: 11 },
      { id: 'sd', name: 'Snare Drum (sd:0 .. sd:12)', category: 'percussion', count: 13 },
      { id: 'hh', name: 'Closed Hi-Hat (hh:0 .. hh:8)', category: 'percussion', count: 9 },
      { id: 'oh', name: 'Open Hi-Hat (oh:0 .. oh:4)', category: 'percussion', count: 5 },
      { id: 'cp', name: 'Hand Clap (cp:0 .. cp:4)', category: 'percussion', count: 5 },
      { id: 'rim', name: 'Rimshot (rim:0 .. rim:3)', category: 'percussion', count: 4 },
      { id: 'cr', name: 'Crash Cymbal (cr:0 .. cr:3)', category: 'percussion', count: 4 },
      { id: 'rd', name: 'Ride Cymbal (rd:0 .. rd:3)', category: 'percussion', count: 4 },
      { id: 'cb', name: 'Cowbell (cb:0 .. cb:2)', category: 'percussion', count: 3 },
      { id: 'casio', name: 'Casio VL-Tone Synthesized Percussion', category: 'retro', count: 3 },
      { id: 'jazz', name: 'Acoustic Jazz Drumkit', category: 'acoustic', count: 8 },
      { id: 'metal', name: 'Industrial Metallic Percussion', category: 'industrial', count: 6 },
      { id: 'numbers', name: 'Spoken Numbers Voice Synthesizer', category: 'voice', count: 10 }
    ]
  };
}

async function syncAll() {
  console.log('[SYNC:CONTENT] Starting offline-first Strudel content synchronization...');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`[SYNC:CONTENT] Created data directory: ${DATA_DIR}`);
  }

  // 1. Synchronize Reference Catalog
  console.log('[SYNC:CONTENT] 1. Extracting Reference Catalog (functions, methods, syntax)...');
  const indexText = await fetchUpstreamText(INDEX_URL);
  let referenceDocs = extractDocsFromBundle(indexText);

  if (referenceDocs && referenceDocs.length > 0) {
    console.log(`[SYNC:CONTENT] Successfully extracted ${referenceDocs.length} functions from upstream bundle.`);
  } else {
    console.log('[SYNC:CONTENT] Using bundled reference baseline fallback...');
    // Fallback if network unavailable or upstream format changed
    referenceDocs = [
      { name: 's', category: 'core', tags: ['core', 'sound'], description: 'Plays samples or soundfonts matching the given mini-notation pattern string.', params: [{ name: 'pattern', type: 'string', description: 'Pattern sequence' }], returns: 'Pattern', examples: ['s("bd sd hh cp")'] },
      { name: 'sound', category: 'core', tags: ['core', 'sound'], description: 'Alias for s(). Evaluates rhythmic sound pattern.', params: [{ name: 'pattern', type: 'string', description: 'Pattern sequence' }], returns: 'Pattern', examples: ['sound("bd [sd hh] cp")'] },
      { name: 'note', category: 'pitch', tags: ['pitch', 'melody'], description: 'Produces musical notes by note name (e.g. c3, d4, eb4, f#4) or semitone offsets.', params: [{ name: 'pattern', type: 'string', description: 'Pitch pattern' }], returns: 'Pattern', examples: ['note("c3 e3 g3 b3")'] },
      { name: 'n', category: 'pitch', tags: ['pitch', 'index'], description: 'Selects sound sample index or note number within the active sound bank.', params: [{ name: 'pattern', type: 'string|number', description: 'Index pattern' }], returns: 'Pattern', examples: ['s("bd").n("0 1 2 3")'] },
      { name: 'cpm', category: 'tempo', tags: ['tempo', 'time'], description: 'Sets cycles per minute for tempo control (1 cpm = 4/4 bar per minute).', params: [{ name: 'tempo', type: 'number', description: 'Cycles per minute' }], returns: 'Pattern', examples: ['cpm(120)'] },
      { name: 'fast', category: 'time', tags: ['time', 'speed'], description: 'Speed up a pattern by the given factor.', params: [{ name: 'factor', type: 'number', description: 'Speed multiplier' }], returns: 'Pattern', examples: ['s("bd sd").fast(2)'] },
      { name: 'slow', category: 'time', tags: ['time', 'speed'], description: 'Slow down a pattern by the given factor.', params: [{ name: 'factor', type: 'number', description: 'Division factor' }], returns: 'Pattern', examples: ['s("bd sd").slow(2)'] },
      { name: 'rev', category: 'transform', tags: ['transform', 'reverse'], description: 'Reverses the pattern within each cycle.', params: [], returns: 'Pattern', examples: ['s("bd sd hh cp").rev()'] },
      { name: 'jux', category: 'stereo', tags: ['stereo', 'spatial'], description: 'Applies a transformation function to the right stereo channel only.', params: [{ name: 'fn', type: 'function', description: 'Transformation function' }], returns: 'Pattern', examples: ['note("c3 d3 e3 g3").jux(rev)'] },
      { name: 'stack', category: 'polyphony', tags: ['polyphony', 'layering'], description: 'Layers multiple patterns together to play concurrently in polyphony.', params: [{ name: '...patterns', type: 'Pattern', description: 'Patterns to stack' }], returns: 'Pattern', examples: ['stack(s("bd sd"), s("hh*4"))'] },
      { name: 'seq', category: 'composition', tags: ['composition', 'sequence'], description: 'Sequences patterns sequentially cycle by cycle.', params: [{ name: '...patterns', type: 'Pattern', description: 'Patterns to sequence' }], returns: 'Pattern', examples: ['seq(s("bd sd"), s("hh*4"))'] },
      { name: 'gain', category: 'volume', tags: ['audio', 'volume'], description: 'Controls audio volume amplitude between 0 and 1.', params: [{ name: 'amount', type: 'number', description: 'Gain value' }], returns: 'Pattern', examples: ['s("bd sd").gain(0.8)'] },
      { name: 'pan', category: 'stereo', tags: ['audio', 'pan'], description: 'Pans stereo placement from 0 (left) to 1 (right) with 0.5 center.', params: [{ name: 'position', type: 'number', description: 'Pan position' }], returns: 'Pattern', examples: ['s("hh").pan("0 0.5 1")'] },
      { name: 'lpf', category: 'filter', tags: ['audio', 'filter'], description: 'Low pass cutoff frequency filter in Hertz (e.g. 200 .. 8000).', params: [{ name: 'freq', type: 'number', description: 'Cutoff frequency in Hz' }], returns: 'Pattern', examples: ['s("sawtooth").lpf(1200)'] },
      { name: 'hpf', category: 'filter', tags: ['audio', 'filter'], description: 'High pass filter cutoff frequency in Hertz.', params: [{ name: 'freq', type: 'number', description: 'Cutoff frequency in Hz' }], returns: 'Pattern', examples: ['s("sawtooth").hpf(400)'] },
      { name: 'delay', category: 'effects', tags: ['audio', 'delay'], description: 'Wet mix level of the feedback delay effect (0 .. 1).', params: [{ name: 'amount', type: 'number', description: 'Delay send amount' }], returns: 'Pattern', examples: ['s("sd").delay(0.5)'] },
      { name: 'room', category: 'effects', tags: ['audio', 'reverb'], description: 'Reverb room size send level (0 .. 1).', params: [{ name: 'amount', type: 'number', description: 'Reverb size' }], returns: 'Pattern', examples: ['s("sd").room(0.6)'] }
    ];
  }

  const sanitizedReference = sanitizeObject(referenceDocs);
  const refPath = path.join(DATA_DIR, 'reference.json');
  fs.writeFileSync(refPath, JSON.stringify(sanitizedReference, null, 2), 'utf8');
  console.log(`[SYNC:CONTENT] Wrote reference catalog (${sanitizedReference.length} items) -> src/data/reference.json`);

  // 2. Synchronize Patterns Catalog
  console.log('[SYNC:CONTENT] 2. Extracting Patterns Catalog (presets, demonstrations)...');
  const patternsText = await fetchUpstreamText(PATTERNS_URL);
  let patternsList = extractPatternsFromBundle(patternsText);

  if (patternsList && patternsList.length > 0) {
    console.log(`[SYNC:CONTENT] Successfully extracted ${patternsList.length} pattern presets from upstream bundle.`);
  } else {
    console.log('[SYNC:CONTENT] Using bundled pattern presets fallback...');
    patternsList = [
      { id: 'pat-1', title: 'Classic Four-on-the-Floor', author: 'Strudel Core', tags: ['drums', 'techno'], code: 's("bd [~ bd] bd ~")\n  .stack(s("~ [sd,cp] ~ [sd,cp]"))\n  .stack(s("hh*8").gain(0.6))' },
      { id: 'pat-2', title: 'Polyrhythmic Jungle Break', author: 'Strudel Core', tags: ['drums', 'breakbeat'], code: 's("bd [sd [~ bd]] [~ sd] [hh*2]")\n  .fast(1.25)\n  .jux(rev)' },
      { id: 'pat-3', title: 'Acid Baseline Modulation', author: 'Strudel Core', tags: ['bass', 'synth'], code: 'note("c2 [eb2 g2] bb2 [c3 bb2]")\n  .s("sawtooth")\n  .lpf(sine.range(300, 3000).slow(4))\n  .resonance(12)' },
      { id: 'pat-4', title: 'Generative Ambient Chords', author: 'Strudel Core', tags: ['ambient', 'chords'], code: 'note("<[c3,g3,c4] [eb3,bb3,eb4] [f3,c4,f4] [g3,d4,g4]>")\n  .s("triangle")\n  .room(0.8)\n  .delay(0.4)' },
      { id: 'pat-5', title: 'Super Mario World Swimming Theme', author: 'Koji Kondo', tags: ['harmonic', 'game'], code: '// Koji Kondo - Swimming (Super Mario World)\nstack(\n  seq(\n    "~", "~", "~",\n    "A5 [F5@2 C5] [D5@2 F5] F5",\n    "[C5@2 F5] [F5@2 C6] A5 G5"\n  ).color("#FFEBB5"),\n  seq(\n    "[F4,Bb4,D5] [[D4,G4,Bb4]@2 [Bb3,D4,F4]]",\n    "[~ [F3, A3, C3] [F3, A3, C3]]"\n  )\n)' }
    ];
  }

  const sanitizedPatterns = sanitizeObject(patternsList);
  const patPath = path.join(DATA_DIR, 'patterns.json');
  fs.writeFileSync(patPath, JSON.stringify(sanitizedPatterns, null, 2), 'utf8');
  console.log(`[SYNC:CONTENT] Wrote patterns catalog (${sanitizedPatterns.length} items) -> src/data/patterns.json`);

  // 3. Synchronize Sounds Catalog
  console.log('[SYNC:CONTENT] 3. Building Sounds Catalog (drum machines, synths, soundfonts, samples)...');
  const soundsCatalog = buildDefaultSoundsCatalog();
  const sanitizedSounds = sanitizeObject(soundsCatalog);
  const soundsPath = path.join(DATA_DIR, 'sounds.json');
  fs.writeFileSync(soundsPath, JSON.stringify(sanitizedSounds, null, 2), 'utf8');
  console.log(`[SYNC:CONTENT] Wrote sounds catalog -> src/data/sounds.json`);

  console.log('[SYNC:CONTENT] Content synchronization completed successfully. All catalogs are 100% local and offline-first.');
}

if (require.main === module) {
  syncAll().catch(err => {
    console.error(`[SYNC:ERROR] ${err.message}`);
    process.exit(1);
  });
}

module.exports = { syncAll, extractDocsFromBundle, extractPatternsFromBundle, buildDefaultSoundsCatalog };
