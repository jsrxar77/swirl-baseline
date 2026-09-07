/**
 * Strudel Local REPL - Drawer Dynamic Extension Module
 * Handles local offline dynamic rendering and interaction for:
 * 1. Reference Catalog (search, filter by category/tag, parameters, interactive examples)
 * 2. Sounds Catalog (drum machines, synths, soundfonts, sample kits, local Web Audio audition)
 * 3. Patterns Catalog (presets library, categorization, one-click load, local .strudel import/export)
 *
 * Governance:
 * - REGLA DE ORO 3: Cero emojis.
 * - REGLA DE ORO 9: Funcionamiento 100% local y offline-first incondicional.
 */

(function () {
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // 100% Local Web Audio Audition Synthesizer (Zero Network Calls)
  function playAuditionTone(type, pitch = 261.63, duration = 0.4) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const validWaveforms = ['sine', 'sawtooth', 'square', 'triangle'];
      osc.type = validWaveforms.includes(type) ? type : 'sawtooth';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.05);
    } catch (err) {
      console.warn('[AUDITION:LOCAL] Audio preview notice:', err.message);
    }
  }

  function playAuditionDrum(voice) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const v = (voice || 'bd').toLowerCase();

      if (v.includes('bd') || v.includes('kick')) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (v.includes('sd') || v.includes('snare')) {
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else {
        // Hi-hat / Cymbal / Percussion click
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6000, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      }
    } catch (err) {
      console.warn('[AUDITION:DRUM] Drum preview notice:', err.message);
    }
  }

  // Main Extension Initializer
  function initDrawerExtension(api) {
    const { getEditorInstance, showToast, logToConsole } = api;

    function setEditorContent(code, append = false) {
      const editor = getEditorInstance();
      if (!editor) return;
      if (append) {
        const current = typeof editor.getCode === 'function' ? editor.getCode() : (editor.code || '');
        const updated = current ? `${current}\n\n${code}` : code;
        if (typeof editor.setCode === 'function') editor.setCode(updated);
        else editor.code = updated;
      } else {
        if (typeof editor.setCode === 'function') editor.setCode(code);
        else editor.code = code;
      }
      showToast('Loaded into editor!');
      logToConsole('system', 'Updated editor code from drawer catalog.');
    }

    // -------------------------------------------------------------
    // 1. REFERENCE CATALOG CONTROLLER
    // -------------------------------------------------------------
    async function initReference() {
      const mount = document.getElementById('reference-view');
      if (!mount) return;

      let docs = [];
      if (window.__STRUDEL_REFERENCE__ && Array.isArray(window.__STRUDEL_REFERENCE__)) {
        docs = window.__STRUDEL_REFERENCE__;
      } else {
        try {
          const res = await fetch('./data/reference.json');
          if (res.ok) {
            docs = await res.json();
          }
        } catch (e) {
          console.warn('[REFERENCE:LOAD] Local fetch notice:', e.message);
        }
      }

      if (!Array.isArray(docs) || docs.length === 0) {
        mount.innerHTML = '<div class="catalog-empty">No reference entries found in local catalog.</div>';
        return;
      }

      // Collect primary tags / categories
      const tagSet = new Set(['all']);
      docs.forEach(d => {
        if (d.category) tagSet.add(d.category);
        (d.tags || []).forEach(t => tagSet.add(t));
      });
      const topTags = Array.from(tagSet).slice(0, 16);

      let activeTag = 'all';
      let searchQuery = '';

      mount.innerHTML = `
        <div class="catalog-search-bar">
          <input type="text" id="ref-search-input" class="drawer-input" placeholder="Search functions, methods, filters (e.g. s, note, jux, lpf)..." />
          <button id="ref-search-clear" class="btn-xs btn-outline">Clear</button>
        </div>
        <div class="catalog-tag-pills" id="ref-tag-pills">
          ${topTags.map(t => `<button class="tag-pill ${t === 'all' ? 'active' : ''}" data-tag="${t}">${t}</button>`).join('')}
        </div>
        <div class="catalog-count-bar" id="ref-count-bar">Showing ${docs.length} functions</div>
        <div class="catalog-cards-list" id="ref-cards-list"></div>
      `;

      const searchInput = mount.querySelector('#ref-search-input');
      const searchClear = mount.querySelector('#ref-search-clear');
      const tagPillsContainer = mount.querySelector('#ref-tag-pills');
      const countBar = mount.querySelector('#ref-count-bar');
      const cardsList = mount.querySelector('#ref-cards-list');

      function renderCards() {
        const query = searchQuery.trim().toLowerCase();
        const filtered = docs.filter(item => {
          const matchesTag = activeTag === 'all' || item.category === activeTag || (item.tags && item.tags.includes(activeTag));
          if (!matchesTag) return false;
          if (!query) return true;
          const nameMatch = item.name.toLowerCase().includes(query);
          const descMatch = (item.description || '').toLowerCase().includes(query);
          const synMatch = (item.synonyms || []).some(s => s.toLowerCase().includes(query));
          return nameMatch || descMatch || synMatch;
        });

        countBar.textContent = `Showing ${filtered.length} of ${docs.length} functions`;

        if (filtered.length === 0) {
          cardsList.innerHTML = '<div class="catalog-empty">No matching functions found.</div>';
          return;
        }

        // Render virtual-like slice for high performance
        const displayLimit = 60;
        const visibleItems = filtered.slice(0, displayLimit);

        cardsList.innerHTML = visibleItems.map(item => {
          const paramsStr = (item.params || []).map(p => `${p.name}${p.optional ? '?' : ''}`).join(', ');
          const signature = `${item.name}(${paramsStr})`;
          const tagsHtml = (item.tags || []).slice(0, 4).map(t => `<span class="badge badge-tag">${t}</span>`).join('');
          const hasExamples = item.examples && item.examples.length > 0;
          const primaryExample = hasExamples ? item.examples[0] : `${item.name}()`;

          const paramsTableHtml = (item.params && item.params.length > 0)
            ? `<div class="ref-params-table">
                <table>
                  <thead><tr><th>Param</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    ${item.params.map(p => `<tr>
                      <td class="param-name"><code>${p.name}${p.optional ? ' (opt)' : ''}</code></td>
                      <td class="param-type">${p.type || 'any'}</td>
                      <td class="param-desc">${p.description || '-'}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>`
            : '';

          return `
            <div class="ref-card" id="doc-${item.name}">
              <div class="ref-card-header">
                <span class="ref-name"><code>${signature}</code></span>
                <span class="ref-tags">${tagsHtml}</span>
              </div>
              <div class="ref-desc">${item.description || 'No description available.'}</div>
              ${paramsTableHtml}
              ${hasExamples ? `
                <div class="ref-example-box">
                  <div class="ref-example-header">
                    <span class="ref-example-label">Example</span>
                    <div class="ref-example-actions">
                      <button class="btn-xs btn-action btn-load-code" data-code="${encodeURIComponent(primaryExample)}">Load</button>
                      <button class="btn-xs btn-action btn-append-code" data-code="${encodeURIComponent(primaryExample)}">Append</button>
                      <button class="btn-xs btn-outline btn-copy-code" data-code="${encodeURIComponent(primaryExample)}">Copy</button>
                    </div>
                  </div>
                  <pre class="ref-code-block"><code>${primaryExample}</code></pre>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');

        if (filtered.length > displayLimit) {
          const moreBanner = document.createElement('div');
          moreBanner.className = 'catalog-more-notice';
          moreBanner.textContent = `Showing first ${displayLimit} matches. Refine search query for specific terms.`;
          cardsList.appendChild(moreBanner);
        }

        // Attach action listeners
        cardsList.querySelectorAll('.btn-load-code').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = decodeURIComponent(btn.dataset.code);
            setEditorContent(code, false);
          });
        });
        cardsList.querySelectorAll('.btn-append-code').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = decodeURIComponent(btn.dataset.code);
            setEditorContent(code, true);
          });
        });
        cardsList.querySelectorAll('.btn-copy-code').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = decodeURIComponent(btn.dataset.code);
            if (navigator.clipboard) {
              navigator.clipboard.writeText(code).then(() => showToast('Copied to clipboard!'));
            }
          });
        });
      }

      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderCards();
      });

      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        renderCards();
      });

      tagPillsContainer.querySelectorAll('.tag-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          tagPillsContainer.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeTag = btn.dataset.tag;
          renderCards();
        });
      });

      renderCards();
    }

    // -------------------------------------------------------------
    // 2. SOUNDS CATALOG CONTROLLER
    // -------------------------------------------------------------
    async function initSounds() {
      const mount = document.getElementById('sounds-view');
      if (!mount) return;

      let soundsData = { drumMachines: [], synths: [], soundfonts: [], sampleKits: [] };
      if (window.__STRUDEL_SOUNDS__ && typeof window.__STRUDEL_SOUNDS__ === 'object') {
        soundsData = window.__STRUDEL_SOUNDS__;
      } else {
        try {
          const res = await fetch('./data/sounds.json');
          if (res.ok) {
            soundsData = await res.json();
          }
        } catch (e) {
          console.warn('[SOUNDS:LOAD] Local fetch notice:', e.message);
        }
      }

      mount.innerHTML = `
        <div class="catalog-search-bar">
          <input type="text" id="sounds-search-input" class="drawer-input" placeholder="Search drum machines, synths, soundfonts, samples..." />
          <button id="sounds-search-clear" class="btn-xs btn-outline">Clear</button>
        </div>
        <div class="catalog-tag-pills" id="sounds-category-pills">
          <button class="tag-pill active" data-cat="all">All Sounds</button>
          <button class="tag-pill" data-cat="drum-machines">Drum Machines</button>
          <button class="tag-pill" data-cat="synths">Synths & Oscillators</button>
          <button class="tag-pill" data-cat="soundfonts">Soundfonts</button>
          <button class="tag-pill" data-cat="sampleKits">Sample Kits</button>
        </div>
        <div class="catalog-cards-list" id="sounds-cards-list"></div>
      `;

      const searchInput = mount.querySelector('#sounds-search-input');
      const searchClear = mount.querySelector('#sounds-search-clear');
      const catPills = mount.querySelector('#sounds-category-pills');
      const cardsList = mount.querySelector('#sounds-cards-list');

      let activeCategory = 'all';
      let searchQuery = '';

      function renderSoundCards() {
        const query = searchQuery.trim().toLowerCase();
        let items = [];

        if (activeCategory === 'all' || activeCategory === 'drum-machines') {
          (soundsData.drumMachines || []).forEach(d => {
            items.push({
              kind: 'Drum Machine',
              id: d.id,
              name: d.name,
              category: d.category,
              details: `Voices: ${(d.voices || []).join(', ')}`,
              snippet: `s("${d.id}:0 ${d.id}:1 ${d.id}:2")`,
              auditionType: 'drum',
              auditionArg: d.voices ? d.voices[0] : 'bd'
            });
          });
        }

        if (activeCategory === 'all' || activeCategory === 'synths') {
          (soundsData.synths || []).forEach(s => {
            items.push({
              kind: 'Synth / Osc',
              id: s.id,
              name: s.name,
              category: s.category,
              details: s.waveform ? `Waveform: ${s.waveform}` : `Parameters: ${(s.params || []).join(', ')}`,
              snippet: `note("c3 e3 g3 b3").s("${s.id}")`,
              auditionType: 'tone',
              auditionArg: s.waveform || 'sawtooth'
            });
          });
        }

        if (activeCategory === 'all' || activeCategory === 'soundfonts') {
          (soundsData.soundfonts || []).forEach(sf => {
            items.push({
              kind: 'Soundfont',
              id: sf.id,
              name: sf.name,
              category: sf.category,
              details: `MIDI Program: ${sf.program}`,
              snippet: `note("c4 d4 e4 g4").soundfont("${sf.id}")`,
              auditionType: 'tone',
              auditionArg: 'triangle'
            });
          });
        }

        if (activeCategory === 'all' || activeCategory === 'sampleKits') {
          (soundsData.sampleKits || []).forEach(sk => {
            items.push({
              kind: 'Sample Kit',
              id: sk.id,
              name: sk.name,
              category: sk.category,
              details: `Samples: ${sk.count} variations`,
              snippet: `s("${sk.id}*4").n("0 1 2 3")`,
              auditionType: 'drum',
              auditionArg: sk.id
            });
          });
        }

        if (query) {
          items = items.filter(it => it.name.toLowerCase().includes(query) || it.id.toLowerCase().includes(query) || it.details.toLowerCase().includes(query));
        }

        if (items.length === 0) {
          cardsList.innerHTML = '<div class="catalog-empty">No matching sound banks found.</div>';
          return;
        }

        cardsList.innerHTML = items.map(item => `
          <div class="sound-card">
            <div class="sound-card-header">
              <div>
                <span class="sound-name">${item.name}</span>
                <span class="badge badge-tag">${item.kind}</span>
                <span class="badge badge-accent"><code>${item.id}</code></span>
              </div>
              <div class="sound-actions">
                <button class="btn-xs btn-action btn-audition" data-type="${item.auditionType}" data-arg="${item.auditionArg}">Audition</button>
                <button class="btn-xs btn-action btn-load-sound" data-code="${encodeURIComponent(item.snippet)}">Insert</button>
                <button class="btn-xs btn-outline btn-copy-sound" data-code="${encodeURIComponent(item.snippet)}">Copy</button>
              </div>
            </div>
            <div class="sound-details">${item.details}</div>
            <div class="sound-snippet"><code>${item.snippet}</code></div>
          </div>
        `).join('');

        cardsList.querySelectorAll('.btn-audition').forEach(btn => {
          btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const arg = btn.dataset.arg;
            if (type === 'drum') {
              playAuditionDrum(arg);
            } else {
              playAuditionTone(arg, 261.63, 0.45);
            }
          });
        });

        cardsList.querySelectorAll('.btn-load-sound').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = decodeURIComponent(btn.dataset.code);
            setEditorContent(code, true);
          });
        });

        cardsList.querySelectorAll('.btn-copy-sound').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = decodeURIComponent(btn.dataset.code);
            if (navigator.clipboard) {
              navigator.clipboard.writeText(code).then(() => showToast('Copied to clipboard!'));
            }
          });
        });
      }

      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderSoundCards();
      });

      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        renderSoundCards();
      });

      catPills.querySelectorAll('.tag-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          catPills.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeCategory = btn.dataset.cat;
          renderSoundCards();
        });
      });

      renderSoundCards();
    }

    // -------------------------------------------------------------
    // 3. PATTERNS CATALOG CONTROLLER
    // -------------------------------------------------------------
    async function initPatterns() {
      const mount = document.getElementById('patterns-view');
      if (!mount) return;

      let patterns = [];
      if (window.__STRUDEL_PATTERNS__ && Array.isArray(window.__STRUDEL_PATTERNS__)) {
        patterns = window.__STRUDEL_PATTERNS__;
      } else {
        try {
          const res = await fetch('./data/patterns.json');
          if (res.ok) {
            patterns = await res.json();
          }
        } catch (e) {
          console.warn('[PATTERNS:LOAD] Local fetch notice:', e.message);
        }
      }

      mount.innerHTML = `
        <div class="patterns-toolbar">
          <div class="patterns-toolbar-actions">
            <label class="btn-xs btn-outline file-input-label">
              Import .strudel File
              <input type="file" id="patterns-file-import" accept=".strudel,.txt,.js" style="display:none;" />
            </label>
            <button id="patterns-export-active" class="btn-xs btn-outline">Export Active Pattern</button>
          </div>
        </div>
        <div class="catalog-search-bar">
          <input type="text" id="pat-search-input" class="drawer-input" placeholder="Search patterns by title, author, genre..." />
          <button id="pat-search-clear" class="btn-xs btn-outline">Clear</button>
        </div>
        <div class="catalog-tag-pills" id="pat-category-pills">
          <button class="tag-pill active" data-tag="all">All</button>
          <button class="tag-pill" data-tag="drums">Drums</button>
          <button class="tag-pill" data-tag="bass">Bass</button>
          <button class="tag-pill" data-tag="synth">Synth</button>
          <button class="tag-pill" data-tag="harmonic">Harmonic</button>
          <button class="tag-pill" data-tag="ambient">Ambient</button>
        </div>
        <div class="catalog-cards-list" id="pat-cards-list"></div>
      `;

      const searchInput = mount.querySelector('#pat-search-input');
      const searchClear = mount.querySelector('#pat-search-clear');
      const tagPills = mount.querySelector('#pat-category-pills');
      const cardsList = mount.querySelector('#pat-cards-list');
      const fileImport = mount.querySelector('#patterns-file-import');
      const exportActive = mount.querySelector('#patterns-export-active');

      let activeTag = 'all';
      let searchQuery = '';

      // Local file import handler (FileReader API)
      if (fileImport) {
        fileImport.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            const content = evt.target.result;
            if (content) {
              setEditorContent(content, false);
              showToast(`Imported ${file.name}`);
            }
          };
          reader.readAsText(file);
        });
      }

      // Local file export handler
      if (exportActive) {
        exportActive.addEventListener('click', () => {
          const editor = getEditorInstance();
          const code = editor && typeof editor.getCode === 'function' ? editor.getCode() : (editor ? editor.code : '');
          if (!code) {
            showToast('Editor is empty.');
            return;
          }
          const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pattern.strudel';
          a.click();
          URL.revokeObjectURL(url);
          showToast('Saved pattern.strudel');
        });
      }

      function renderPatternCards() {
        const query = searchQuery.trim().toLowerCase();
        const filtered = patterns.filter(p => {
          const tagMatch = activeTag === 'all' || (p.tags && p.tags.includes(activeTag));
          if (!tagMatch) return false;
          if (!query) return true;
          return p.title.toLowerCase().includes(query) || (p.author || '').toLowerCase().includes(query) || p.code.toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
          cardsList.innerHTML = '<div class="catalog-empty">No patterns found matching criteria.</div>';
          return;
        }

        cardsList.innerHTML = filtered.map(item => {
          const tagsHtml = (item.tags || []).map(t => `<span class="badge badge-tag">${t}</span>`).join('');
          return `
            <div class="pattern-card">
              <div class="pattern-card-header">
                <div>
                  <span class="pattern-title">${item.title}</span>
                  <span class="pattern-author">by ${item.author || 'Strudel Community'}</span>
                </div>
                <div class="pattern-actions">
                  <button class="btn-xs btn-action btn-load-pattern" data-code="${encodeURIComponent(item.code)}">Load</button>
                  <button class="btn-xs btn-outline btn-copy-pattern" data-code="${encodeURIComponent(item.code)}">Copy</button>
                </div>
              </div>
              <div class="pattern-tags">${tagsHtml}</div>
              <pre class="pattern-code-preview"><code>${item.code}</code></pre>
            </div>
          `;
        }).join('');

        cardsList.querySelectorAll('.btn-load-pattern').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = decodeURIComponent(btn.dataset.code);
            setEditorContent(code, false);
          });
        });

        cardsList.querySelectorAll('.btn-copy-pattern').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = decodeURIComponent(btn.dataset.code);
            if (navigator.clipboard) {
              navigator.clipboard.writeText(code).then(() => showToast('Copied to clipboard!'));
            }
          });
        });
      }

      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderPatternCards();
      });

      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        renderPatternCards();
      });

      tagPills.querySelectorAll('.tag-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          tagPills.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeTag = btn.dataset.tag;
          renderPatternCards();
        });
      });

      renderPatternCards();
    }

    // Initialize all 3 dynamic tabs
    initReference();
    initSounds();
    initPatterns();
  }

  window.initDrawerExtension = initDrawerExtension;
})();
