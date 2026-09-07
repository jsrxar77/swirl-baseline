/**
 * Strudel REPL Adapter
 * Manages the interactive evaluation runtime, decoupled Web Audio API,
 * cycle visualization canvas, and flash feedback in the Webview DOM.
 * Standard musical timing: 1 cycle = 2000ms (120 BPM in 4/4 meter).
 */

class StrudelReplAdapter {
  constructor(options = {}) {
    this.canvas = options.canvas || document.getElementById('cycle-canvas');
    this.flashOverlay = options.flashOverlay || document.getElementById('eval-flash');
    this.audioContext = null;
    this.isPlaying = false;
    this.events = [];
    this.cycleDurationMs = 2000; // Default 120 BPM (2.0s per cycle)
    this.cycleStartTime = 0;
    this.animFrameId = null;
    this.schedulerTimer = null;
    this.lastTriggeredCycle = -1;
    this.triggeredIndices = new Set();
  }

  ensureAudioContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  triggerFlash() {
    if (!this.flashOverlay) return;
    this.flashOverlay.classList.add('flashing');
    setTimeout(() => {
      this.flashOverlay.classList.remove('flashing');
    }, 120);
  }

  // Mini-notation parser embedded for offline browser execution
  tokenize(input) {
    const tokens = [];
    let i = 0;
    const str = input.trim();
    while (i < str.length) {
      const char = str[i];
      if (/\s/.test(char)) { i++; continue; }
      if (char === '[' || char === ']' || char === ',' || char === '*' || char === '/') {
        tokens.push({ type: 'PUNCT', value: char });
        i++;
        continue;
      }
      if (/[a-zA-Z0-9_~#.]/.test(char)) {
        let word = '';
        while (i < str.length && /[a-zA-Z0-9_~#.]/.test(str[i])) {
          word += str[i];
          i++;
        }
        tokens.push({ type: 'ATOM', value: word });
        continue;
      }
      i++;
    }
    return tokens;
  }

  parseMiniNotation(input) {
    const tokens = this.tokenize(input);
    let pos = 0;

    function parseSequence(stopToken = null) {
      const children = [];
      while (pos < tokens.length) {
        const token = tokens[pos];
        if (stopToken && token.value === stopToken) {
          pos++;
          break;
        }
        if (token.value === '[') {
          pos++;
          children.push({ type: 'Subdivision', children: parseSequence(']') });
          continue;
        }
        if (token.type === 'ATOM') {
          let atomNode = { type: 'Atom', value: token.value };
          pos++;
          if (pos < tokens.length && (tokens[pos].value === '*' || tokens[pos].value === '/')) {
            const op = tokens[pos].value;
            pos++;
            if (pos < tokens.length && tokens[pos].type === 'ATOM') {
              const factor = parseFloat(tokens[pos].value) || 1;
              pos++;
              atomNode = { type: 'ModifiedAtom', operator: op, factor: factor, child: atomNode };
            }
          }
          children.push(atomNode);
          continue;
        }
        pos++;
      }
      return children;
    }

    return { type: 'Sequence', children: parseSequence() };
  }

  flattenEvents(node, start = 0, duration = 1) {
    const events = [];
    if (node.type === 'Sequence' || node.type === 'Subdivision') {
      const total = node.children.length;
      if (total === 0) return events;
      const stepDuration = duration / total;
      for (let i = 0; i < total; i++) {
        const childStart = start + (i * stepDuration);
        events.push(...this.flattenEvents(node.children[i], childStart, stepDuration));
      }
    } else if (node.type === 'Atom') {
      if (node.value !== '~') {
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

  // Authentic procedural sound synthesis
  playDrumSound(soundName) {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (soundName.startsWith('bd')) {
      // Bass Drum: punchy 808-style pitch drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.15);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (soundName.startsWith('sd')) {
      // Snare Drum: tone + noise snap
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);
      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);

      const bufferSize = Math.floor(ctx.sampleRate * 0.1);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } else if (soundName.startsWith('hh')) {
      // Hi-Hat: metallic highpass click
      const bufferSize = Math.floor(ctx.sampleRate * 0.04);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (soundName.startsWith('cp')) {
      // Clap: filtered noise burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.Q.setValueAtTime(2.5, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else {
      // Generic melodic beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  evaluate(code) {
    this.triggerFlash();
    this.ensureAudioContext();

    // 1. Calculate tempo / cycle duration
    let baseCycleDuration = 2000; // Default 120 BPM = 2000 ms per cycle

    // Check for bpm(...) or cpm(...)
    const bpmMatch = code.match(/(?:bpm|cpm)\s*\(\s*([0-9.]+)\s*\)/i);
    if (bpmMatch) {
      const bpm = parseFloat(bpmMatch[1]) || 120;
      baseCycleDuration = (60 / bpm) * 4 * 1000;
    }

    // Check for cps(...)
    const cpsMatch = code.match(/cps\s*\(\s*([0-9.]+)\s*\)/i);
    if (cpsMatch) {
      const cps = parseFloat(cpsMatch[1]) || 0.5;
      baseCycleDuration = (1 / cps) * 1000;
    }

    // Check for .fast(factor)
    const fastMatch = code.match(/\.fast\s*\(\s*([0-9.]+)\s*\)/i);
    if (fastMatch) {
      const factor = parseFloat(fastMatch[1]) || 1;
      baseCycleDuration = baseCycleDuration / factor;
    }

    // Check for .slow(factor)
    const slowMatch = code.match(/\.slow\s*\(\s*([0-9.]+)\s*\)/i);
    if (slowMatch) {
      const factor = parseFloat(slowMatch[1]) || 1;
      baseCycleDuration = baseCycleDuration * factor;
    }

    this.cycleDurationMs = Math.max(250, Math.min(10000, baseCycleDuration));

    // 2. Extract pattern string from s("...") or sound("...")
    let patternStr = 'bd sd hh cp';
    const patternMatch = code.match(/(?:s|sound|note)\s*\(\s*(['"`])(.*?)\1\s*\)/i);
    if (patternMatch && patternMatch[2]) {
      patternStr = patternMatch[2];
    } else {
      // Fallback: extract all non-code words
      const cleaned = code.replace(/s\(.*?\)/g, '').replace(/[^a-zA-Z0-9_~[\]*]/g, ' ').trim();
      if (cleaned.length > 0) {
        patternStr = cleaned;
      }
    }

    // 3. Parse AST and generate precise fractional timing events
    const ast = this.parseMiniNotation(patternStr);
    this.events = this.flattenEvents(ast, 0, 1);
    if (this.events.length === 0) {
      this.events = [
        { time: 0.0, duration: 0.25, value: 'bd' },
        { time: 0.25, duration: 0.25, value: 'sd' },
        { time: 0.5, duration: 0.25, value: 'hh' },
        { time: 0.75, duration: 0.25, value: 'cp' }
      ];
    }

    this.isPlaying = true;
    this.cycleStartTime = performance.now();
    this.lastTriggeredCycle = -1;
    this.triggeredIndices.clear();

    // 4. Setup high-precision audio scheduler (20ms interval)
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    this.schedulerTimer = setInterval(() => this.tickAudio(), 20);

    // 5. Setup smooth 60fps canvas render loop
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    const renderLoop = () => {
      if (!this.isPlaying) return;
      const elapsed = performance.now() - this.cycleStartTime;
      const progress = (elapsed % this.cycleDurationMs) / this.cycleDurationMs;
      this.drawCycle(progress);
      this.animFrameId = requestAnimationFrame(renderLoop);
    };
    this.animFrameId = requestAnimationFrame(renderLoop);

    return {
      status: 'playing',
      cycleDurationMs: this.cycleDurationMs,
      eventsCount: this.events.length
    };
  }

  tickAudio() {
    if (!this.isPlaying || this.events.length === 0) return;
    const now = performance.now();
    const elapsed = now - this.cycleStartTime;
    const currentCycleNumber = Math.floor(elapsed / this.cycleDurationMs);
    const cycleProgress = (elapsed % this.cycleDurationMs) / this.cycleDurationMs;

    // Reset triggered set when cycle wraps
    if (currentCycleNumber !== this.lastTriggeredCycle) {
      this.lastTriggeredCycle = currentCycleNumber;
      this.triggeredIndices.clear();
    }

    // Check which events should fire in this tick
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i];
      if (!this.triggeredIndices.has(i) && cycleProgress >= ev.time) {
        this.triggeredIndices.add(i);
        this.playDrumSound(ev.value);
      }
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
    this.clearCanvas();
  }

  clearCanvas() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCycle(progress) {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background track
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, width, height);

    // Draw quarter beat dividers (4/4 time)
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    for (let b = 1; b < 4; b++) {
      const bx = (b / 4) * width;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx, height);
      ctx.stroke();
    }

    // Draw event blocks
    for (const ev of this.events) {
      const x = ev.time * width;
      const w = Math.max(4, ev.duration * width - 2);
      const isCurrent = progress >= ev.time && progress < (ev.time + ev.duration);

      ctx.fillStyle = isCurrent ? '#388bfd' : '#21262d';
      ctx.fillRect(x + 1, 4, w, height - 8);

      ctx.strokeStyle = isCurrent ? '#58a6ff' : '#30363d';
      ctx.strokeRect(x + 1, 4, w, height - 8);

      ctx.fillStyle = isCurrent ? '#ffffff' : '#8b949e';
      ctx.font = '11px monospace';
      ctx.fillText(ev.value, x + 5, height / 2 + 4);
    }

    // Draw smooth playhead
    const playheadX = progress * width;
    ctx.strokeStyle = '#3fb950';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }
}

window.StrudelReplAdapter = StrudelReplAdapter;
