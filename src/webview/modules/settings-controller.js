/**
 * Strudel Local REPL - Settings Controller
 * Handles local persistence and reactive application of:
 * - 37 visual color themes (theme switcher)
 * - 17 font families & font size scaling
 * - CodeMirror editor features (brackets, line numbers, active line, flashing, highlighting, tooltips, autocompletion)
 * - Audio engine controls (polyphony, multichannel orbits, audioEngineTarget)
 *
 * Governance:
 * - REGLA DE ORO 3: Cero emojis.
 * - REGLA DE ORO 9: Funcionamiento 100% local y offline-first incondicional.
 */

(function () {
  const STORAGE_KEY = 'strudel_local_settings_v1';
  let themesData = {};

  const defaultSettings = {
    theme: 'strudelTheme',
    fontFamily: 'monospace',
    fontSize: 14,
    lineWrap: false,
    lineNumbers: true,
    activeLine: true,
    bracketMatching: true,
    autoCloseBrackets: true,
    patternHighlighting: true,
    autoCompletion: true,
    tooltips: true,
    tabIndentation: true,
    multiCursor: true,
    blockEval: false,
    evalFlash: true,
    cssAnimations: true,
    patternAutoStart: false,
    maxPolyphony: 32,
    multiChannelOrbits: false,
    audioEngineTarget: 'webaudio'
  };

  function loadSavedSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...defaultSettings, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('[SETTINGS:LOAD] Notice:', e.message);
    }
    return { ...defaultSettings };
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[SETTINGS:SAVE] Notice:', e.message);
    }
  }

  function applyThemeVariables(themeName, themes) {
    const palette = (themes && themes[themeName]) || (themes && themes.strudelTheme) || {
      background: '#0e1117',
      foreground: '#ffffff',
      lineHighlight: '#161b22',
      selection: 'rgba(56, 139, 253, 0.3)',
      caret: '#58a6ff',
      muted: '#8b949e'
    };

    let styleEl = document.getElementById('strudel-dynamic-theme-vars');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'strudel-dynamic-theme-vars';
      document.head.appendChild(styleEl);
    }

    const isLight = Boolean(palette.light || ['githubLight', 'solarizedLight', 'vscodeLight', 'whitescreen', 'xcodeLight', 'materialLight', 'gruvboxLight', 'tokyoNightDay'].includes(themeName));
    const bg = palette.background || (isLight ? '#ffffff' : '#0e1117');
    const fg = palette.foreground || (isLight ? '#1f2328' : '#ffffff');
    const lineHl = palette.lineHighlight || (isLight ? '#f6f8fa' : '#161b22');
    const sel = palette.selection || (isLight ? 'rgba(9, 105, 218, 0.2)' : 'rgba(56, 139, 253, 0.3)');
    const caret = palette.caret || (isLight ? '#0969da' : '#58a6ff');
    const muted = palette.muted || (isLight ? '#656d76' : '#8b949e');
    
    // Derive menu, header and drawer colors directly from the theme background and foreground
    const bgSecondary = `color-mix(in srgb, ${bg} 88%, ${fg} 12%)`;
    const bgTertiary = `color-mix(in srgb, ${bg} 76%, ${fg} 24%)`;
    const border = `color-mix(in srgb, ${fg} 16%, transparent)`;

    styleEl.innerHTML = `
      :root {
        color-scheme: ${isLight ? 'light' : 'dark'};
        --background: ${bg} !important;
        --foreground: ${fg} !important;
        --bg-primary: ${bg} !important;
        --bg-secondary: ${bgSecondary} !important;
        --bg-tertiary: ${bgTertiary} !important;
        --border-color: ${border} !important;
        --text-primary: ${fg} !important;
        --text-secondary: ${fg} !important;
        --text-muted: ${muted} !important;
        --line-highlight: ${lineHl} !important;
        --selection: ${sel} !important;
        --accent-cyan: ${caret} !important;
      }
      body.strudel-root, .strudel-container {
        background-color: ${bg} !important;
        color: ${fg} !important;
      }
      .strudel-header {
        background-color: ${bgSecondary} !important;
        color: ${fg} !important;
        border-bottom: 1px solid ${border} !important;
      }
      .brand-title, .brand-logo {
        color: ${fg} !important;
      }
      .brand-subtitle {
        color: ${muted} !important;
      }
      .strudel-footer {
        background-color: ${bgSecondary} !important;
        color: ${fg} !important;
        border-top: 1px solid ${border} !important;
      }
      .strudel-footer .label {
        color: ${muted} !important;
      }
      .strudel-footer .value {
        color: ${fg} !important;
      }
      .drawer, .drawer-content {
        background-color: ${bgSecondary} !important;
        color: ${fg} !important;
        border-color: ${border} !important;
      }
      .drawer-header {
        background-color: ${bgTertiary} !important;
        border-bottom: 1px solid ${border} !important;
      }
      .tab-btn {
        color: ${muted} !important;
      }
      .tab-btn:hover {
        color: ${fg} !important;
      }
      .tab-btn.active {
        color: ${fg} !important;
        border-bottom: 2px solid ${caret} !important;
      }
      .pane-heading, .pane-subheading, .preset-title, .sound-name, .pattern-title, .settings-label {
        color: ${fg} !important;
      }
      .pane-desc, .pattern-author, .sound-details, .settings-section-title {
        color: ${muted} !important;
      }
      .settings-section, .preset-card, .sound-item, .ref-card, .sound-card, .pattern-card {
        background-color: ${bgSecondary} !important;
        border-color: ${border} !important;
        color: ${fg} !important;
      }
      .pattern-code-preview, .ref-example-box, .console-feed, .sound-snippet code {
        background-color: ${bgTertiary} !important;
        color: ${fg} !important;
        border-color: ${border} !important;
      }
      .drawer-input, .settings-select {
        background-color: ${bg} !important;
        color: ${fg} !important;
        border-color: ${border} !important;
      }
      .action-btn {
        color: ${fg} !important;
      }
      .action-btn:hover {
        background-color: ${bgTertiary} !important;
        color: ${fg} !important;
      }
      .btn-action, .btn-load-preset {
        background-color: ${bgTertiary} !important;
        color: ${fg} !important;
        border-color: ${border} !important;
      }
      .btn-action:hover, .btn-load-preset:hover {
        background-color: ${caret} !important;
        color: ${bg} !important;
      }
      .tag-pill {
        background-color: ${bgTertiary} !important;
        color: ${muted} !important;
        border-color: ${border} !important;
      }
      .tag-pill.active {
        background-color: ${caret} !important;
        color: ${bg} !important;
        border-color: ${caret} !important;
      }
      .toggle-text {
        color: ${fg} !important;
      }
      .cm-editor {
        background-color: ${bg} !important;
        color: ${fg} !important;
      }
      .cm-editor .cm-content {
        caret-color: ${caret} !important;
        color: ${fg} !important;
      }
      .cm-activeLine {
        background-color: ${lineHl} !important;
      }
      .cm-selectionBackground, .cm-editor ::selection {
        background-color: ${sel} !important;
      }
      .cm-gutters {
        background-color: ${palette.gutterBackground || bg} !important;
        color: ${palette.gutterForeground || muted} !important;
        border-right: 1px solid ${border} !important;
      }
    `;

    if (isLight) {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }

  function applyEditorTypography(fontFamily, fontSize) {
    if (fontFamily) {
      document.documentElement.style.setProperty('--font-mono', fontFamily);
      let fontStyleEl = document.getElementById('strudel-dynamic-font-vars');
      if (!fontStyleEl) {
        fontStyleEl = document.createElement('style');
        fontStyleEl.id = 'strudel-dynamic-font-vars';
        document.head.appendChild(fontStyleEl);
      }
      fontStyleEl.innerHTML = `
        body.strudel-root,
        .cm-editor,
        .cm-editor *,
        .cm-scroller,
        .cm-scroller *,
        .cm-content,
        .cm-content *,
        .cm-line,
        .cm-line *,
        strudel-editor,
        strudel-editor *,
        .pattern-code-preview,
        .ref-code-block,
        .console-feed,
        .code-fallback {
          font-family: ${fontFamily} !important;
        }
      `;
    }

    if (fontSize) {
      let sizeStyleEl = document.getElementById('strudel-dynamic-size-vars');
      if (!sizeStyleEl) {
        sizeStyleEl = document.createElement('style');
        sizeStyleEl.id = 'strudel-dynamic-size-vars';
        document.head.appendChild(sizeStyleEl);
      }
      sizeStyleEl.innerHTML = `
        .cm-editor,
        .cm-editor *,
        .cm-scroller,
        .cm-scroller *,
        .cm-content,
        .cm-content *,
        .cm-line,
        .cm-line *,
        strudel-editor,
        strudel-editor * {
          font-size: ${fontSize}px !important;
        }
      `;
    }

    const cmEditor = document.querySelector('.cm-editor');
    if (cmEditor) {
      if (fontSize) cmEditor.style.fontSize = `${fontSize}px`;
      if (fontFamily) cmEditor.style.fontFamily = fontFamily;
    }
    const strudelEl = document.querySelector('strudel-editor');
    if (strudelEl) {
      if (fontSize) strudelEl.style.fontSize = `${fontSize}px`;
      if (fontFamily) strudelEl.style.fontFamily = fontFamily;
      if (strudelEl.editor) {
        if (typeof strudelEl.editor.setFontSize === 'function' && fontSize) {
          strudelEl.editor.setFontSize(fontSize);
        }
        if (typeof strudelEl.editor.setFontFamily === 'function' && fontFamily) {
          strudelEl.editor.setFontFamily(fontFamily);
        }
      }
    }
  }

  function applyEditorBehavior(key, value, getEditorInstance) {
    const editor = getEditorInstance();
    if (!editor) return;

    if (key === 'lineWrap' && typeof editor.setLineWrappingEnabled === 'function') {
      editor.setLineWrappingEnabled(value);
    }
    if (key === 'fontSize' && typeof editor.setFontSize === 'function') {
      editor.setFontSize(value);
    }
    if (key === 'theme' && typeof editor.setTheme === 'function') {
      editor.setTheme(value);
    }
    if (key === 'lineNumbers' && typeof editor.setLineNumbersDisplayed === 'function') {
      editor.setLineNumbersDisplayed(value);
    }
    if (key === 'bracketMatching' && typeof editor.setBracketMatchingEnabled === 'function') {
      editor.setBracketMatchingEnabled(value);
    }
    if (key === 'autoCloseBrackets' && typeof editor.setBracketClosingEnabled === 'function') {
      editor.setBracketClosingEnabled(value);
    }
    if (key === 'autoCompletion' && typeof editor.setAutocompletionEnabled === 'function') {
      editor.setAutocompletionEnabled(value);
    }
    if (key === 'activeLine' && typeof editor.reconfigureExtension === 'function') {
      editor.reconfigureExtension('isActiveLineHighlighted', value);
    }
    if (key === 'patternHighlighting' && typeof editor.reconfigureExtension === 'function') {
      editor.reconfigureExtension('isPatternHighlightingEnabled', value);
    }
    if (key === 'evalFlash' && typeof editor.reconfigureExtension === 'function') {
      editor.reconfigureExtension('isFlashEnabled', value);
    }
  }

  async function initSettingsController(api) {
    const { getEditorInstance, showToast, logToConsole } = api;
    let settings = loadSavedSettings();

    // Fetch themes catalog
    if (window.__STRUDEL_THEMES__ && typeof window.__STRUDEL_THEMES__ === 'object') {
      themesData = window.__STRUDEL_THEMES__;
    } else {
      try {
        const res = await fetch('./data/themes.json');
        if (res.ok) {
          themesData = await res.json();
        }
      } catch (e) {
        console.warn('[SETTINGS:THEMES] Notice:', e.message);
      }
    }

    // Apply saved theme & font immediately
    applyThemeVariables(settings.theme, themesData);
    applyEditorTypography(settings.fontFamily, settings.fontSize);

    // Ensure CodeMirror persistent store defaults to autocompletion enabled
    try {
      const cmRaw = localStorage.getItem('codemirror-settings');
      const cmSettings = cmRaw ? JSON.parse(cmRaw) : {};
      if (cmSettings.isAutoCompletionEnabled === undefined || settings.autoCompletion) {
        cmSettings.isAutoCompletionEnabled = settings.autoCompletion !== false;
        localStorage.setItem('codemirror-settings', JSON.stringify(cmSettings));
      }
    } catch (e) {
      console.warn('[SETTINGS:CM_STORE] Notice:', e.message);
    }

    // Ensure editor instance receives settings once mounted
    const syncEditorWithDelay = (retries = 5) => {
      const editor = getEditorInstance();
      if (editor) {
        if (typeof editor.setTheme === 'function') editor.setTheme(settings.theme);
        if (typeof editor.setFontSize === 'function') editor.setFontSize(settings.fontSize);
        if (typeof editor.setFontFamily === 'function') editor.setFontFamily(settings.fontFamily);
        if (typeof editor.setAutocompletionEnabled === 'function') {
          editor.setAutocompletionEnabled(settings.autoCompletion !== false);
        }
      } else if (retries > 0) {
        setTimeout(() => syncEditorWithDelay(retries - 1), 200);
      }
    };
    syncEditorWithDelay();

    const container = document.getElementById('settings-view-container');
    if (!container) return;

    const fontFamilies = [
      { id: 'Menlo, Monaco, monospace', label: 'Menlo / Monaco (macOS Terminal Mono)' },
      { id: '"Courier New", Courier, monospace', label: 'Courier New (Serif Typewriter)' },
      { id: '"Andale Mono", monospace', label: 'Andale Mono (Retro Monospace)' },
      { id: '"PT Mono", monospace', label: 'PT Mono (Modern Monospace)' },
      { id: 'Georgia, "Times New Roman", serif', label: 'Georgia (Serif Elegant)' },
      { id: '"Trebuchet MS", "Helvetica Neue", sans-serif', label: 'Trebuchet MS (Humanist Sans)' },
      { id: 'Impact, "Arial Black", sans-serif', label: 'Impact (Heavy Condensed)' },
      { id: '"Comic Sans MS", Chalkboard, cursive, sans-serif', label: 'Comic Sans MS (Casual / Fun)' },
      { id: 'Consolas, "Lucida Console", monospace', label: 'Consolas / Lucida (Windows Mono)' },
      { id: '"SF Mono", "SFMono-Regular", -apple-system, monospace', label: 'SF Mono (Apple System)' },
      { id: '"JetBrains Mono", Menlo, monospace', label: 'JetBrains Mono / Menlo' },
      { id: 'Inconsolata, "Courier New", monospace', label: 'Inconsolata / Courier' }
    ];

    const themeNames = Object.keys(themesData).length > 0
      ? Object.keys(themesData).sort()
      : ['strudelTheme', 'dracula', 'tokyoNight', 'nord', 'gruvboxDark', 'monokai', 'solarizedDark', 'vscodeDark'];

    container.innerHTML = `
      <div class="settings-panel-grid">
        <!-- 1. Visual Theme & Typography -->
        <div class="settings-section">
          <h3 class="settings-section-title">Visual Theme & Typography</h3>
          
          <div class="settings-row">
            <label class="settings-label" for="setting-theme-select">Editor & UI Theme (37 themes):</label>
            <select id="setting-theme-select" class="settings-select">
              ${themeNames.map(t => `<option value="${t}" ${t === settings.theme ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>

          <div class="settings-row">
            <label class="settings-label" for="setting-font-family">Font Family:</label>
            <select id="setting-font-family" class="settings-select">
              ${fontFamilies.map(f => `<option value="${f.id}" ${f.id === settings.fontFamily ? 'selected' : ''}>${f.label}</option>`).join('')}
            </select>
          </div>

          <div class="settings-row">
            <div class="settings-row-header">
              <label class="settings-label" for="setting-font-size-slider">Font Size:</label>
              <span id="font-size-display" class="settings-value-badge">${settings.fontSize}px</span>
            </div>
            <input type="range" id="setting-font-size-slider" class="settings-slider" min="11" max="28" step="1" value="${settings.fontSize}" />
          </div>
        </div>

        <!-- 2. CodeMirror Editor Behaviors -->
        <div class="settings-section">
          <h3 class="settings-section-title">Editor Features & Visualizers</h3>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-line-wrap" ${settings.lineWrap ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Enable Soft Line Wrapping</span>
          </label>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-line-numbers" ${settings.lineNumbers ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Display Line Numbers</span>
          </label>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-active-line" ${settings.activeLine ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Highlight Active Line</span>
          </label>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-bracket-matching" ${settings.bracketMatching ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Highlight Matching Brackets</span>
          </label>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-auto-brackets" ${settings.autoCloseBrackets ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Auto-Close Brackets and Quotes</span>
          </label>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-pattern-highlight" ${settings.patternHighlighting ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Highlight Active Events (Mini-Location Boxes)</span>
          </label>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-autocompletion" ${settings.autoCompletion ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Enable Intelligent Autocompletion</span>
          </label>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-eval-flash" ${settings.evalFlash ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Flash Editor on Evaluation</span>
          </label>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-css-animations" ${settings.cssAnimations ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Enable CSS Animations & Transitions</span>
          </label>
        </div>

        <!-- 3. Audio Engine & Voices -->
        <div class="settings-section">
          <h3 class="settings-section-title">Local Audio Engine Controls</h3>

          <div class="settings-row">
            <div class="settings-row-header">
              <label class="settings-label" for="setting-polyphony">Max Voices Polyphony:</label>
              <span id="polyphony-display" class="settings-value-badge">${settings.maxPolyphony} voices</span>
            </div>
            <input type="range" id="setting-polyphony" class="settings-slider" min="8" max="64" step="4" value="${settings.maxPolyphony}" />
          </div>

          <div class="settings-row">
            <label class="settings-label" for="setting-engine-target">Audio Engine Target:</label>
            <select id="setting-engine-target" class="settings-select">
              <option value="webaudio" selected>Web Audio API (Local Browser)</option>
              <option value="superdirt">SuperDirt (Local UDP OSC)</option>
              <option value="midi">Local Web MIDI Output</option>
            </select>
          </div>

          <label class="settings-toggle">
            <input type="checkbox" id="setting-multichannel" ${settings.multiChannelOrbits ? 'checked' : ''} />
            <span class="toggle-track"></span>
            <span class="toggle-text">Multi-Channel Orbits Routing</span>
          </label>
        </div>

        <!-- Reset Defaults Action -->
        <div class="settings-actions-footer">
          <button id="btn-reset-settings" class="btn-action">Restore All Default Settings</button>
        </div>
      </div>
    `;

    // Event Handlers
    const themeSelect = container.querySelector('#setting-theme-select');
    const fontFamilySelect = container.querySelector('#setting-font-family');
    const fontSizeSlider = container.querySelector('#setting-font-size-slider');
    const fontSizeDisplay = container.querySelector('#font-size-display');
    const polyphonySlider = container.querySelector('#setting-polyphony');
    const polyphonyDisplay = container.querySelector('#polyphony-display');
    const resetBtn = container.querySelector('#btn-reset-settings');

    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        settings.theme = e.target.value;
        saveSettings(settings);
        applyThemeVariables(settings.theme, themesData);
        applyEditorBehavior('theme', settings.theme, getEditorInstance);
        showToast(`Theme switched to ${settings.theme}`);
        logToConsole('system', `Visual theme set to ${settings.theme}`);
      });
    }

    if (fontFamilySelect) {
      fontFamilySelect.addEventListener('change', (e) => {
        settings.fontFamily = e.target.value;
        saveSettings(settings);
        applyEditorTypography(settings.fontFamily, settings.fontSize);
        showToast('Font family updated');
      });
    }

    if (fontSizeSlider && fontSizeDisplay) {
      fontSizeSlider.addEventListener('input', (e) => {
        const size = Number(e.target.value);
        fontSizeDisplay.textContent = `${size}px`;
        settings.fontSize = size;
        saveSettings(settings);
        applyEditorTypography(settings.fontFamily, size);
        applyEditorBehavior('fontSize', size, getEditorInstance);
      });
    }

    if (polyphonySlider && polyphonyDisplay) {
      polyphonySlider.addEventListener('input', (e) => {
        const voices = Number(e.target.value);
        polyphonyDisplay.textContent = `${voices} voices`;
        settings.maxPolyphony = voices;
        saveSettings(settings);
      });
    }

    // Toggle listeners
    const toggleMap = [
      { id: '#setting-line-wrap', key: 'lineWrap' },
      { id: '#setting-line-numbers', key: 'lineNumbers' },
      { id: '#setting-active-line', key: 'activeLine' },
      { id: '#setting-bracket-matching', key: 'bracketMatching' },
      { id: '#setting-auto-brackets', key: 'autoCloseBrackets' },
      { id: '#setting-pattern-highlight', key: 'patternHighlighting' },
      { id: '#setting-autocompletion', key: 'autoCompletion' },
      { id: '#setting-eval-flash', key: 'evalFlash' },
      { id: '#setting-css-animations', key: 'cssAnimations' },
      { id: '#setting-multichannel', key: 'multiChannelOrbits' }
    ];

    toggleMap.forEach(({ id, key }) => {
      const el = container.querySelector(id);
      if (el) {
        el.addEventListener('change', (e) => {
          settings[key] = e.target.checked;
          saveSettings(settings);
          applyEditorBehavior(key, settings[key], getEditorInstance);
          showToast(`Updated ${key}`);
        });
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        settings = { ...defaultSettings };
        saveSettings(settings);
        applyThemeVariables(settings.theme, themesData);
        applyEditorTypography(settings.fontFamily, settings.fontSize);
        initSettingsController(api);
        showToast('Restored default settings');
        logToConsole('system', 'All settings restored to defaults.');
      });
    }
  }

  window.initSettingsController = initSettingsController;
  window.loadStrudelSettings = loadSavedSettings;
})();
