/**
 * Strudel Local REPL - Webview Main Client
 * Manages interaction with the official <strudel-editor> Web Component,
 * header action buttons, drawer tabs, transport state, and bi-directional IPC.
 */

(function () {
  const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

  // DOM Elements - Header Controls
  const btnPlay = document.getElementById('btn-play');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const btnUpdate = document.getElementById('btn-update');
  const btnShare = document.getElementById('btn-share');
  const btnLearn = document.getElementById('btn-learn');
  const btnMenu = document.getElementById('btn-menu');

  // DOM Elements - Drawer & Tabs
  const drawer = document.getElementById('strudel-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const toast = document.getElementById('toast-message');

  // DOM Elements - Status Indicators
  const audioStatus = document.getElementById('audio-status');
  const consoleOutput = document.getElementById('console-output');
  const btnClearConsole = document.getElementById('btn-clear-console');

  let isPlaying = false;

  function getEditorInstance() {
    const el = document.querySelector('strudel-editor');
    return el ? el.editor : null;
  }

  function getEditorCode() {
    const editor = getEditorInstance();
    if (!editor) return '';
    if (typeof editor.getCode === 'function') {
      return editor.getCode();
    }
    return editor.code || '';
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  function logToConsole(type, message) {
    if (!consoleOutput) return;
    const line = document.createElement('div');
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    line.className = `console-line ${type}`;
    line.textContent = `[${timeStr}] ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  function updateTransportUI(playing) {
    isPlaying = playing;
    if (playIcon && playText) {
      if (playing) {
        playIcon.innerHTML = '&#9632;';
        playText.textContent = 'stop';
        btnPlay.classList.add('playing');
      } else {
        playIcon.innerHTML = '&#9654;';
        playText.textContent = 'play';
        btnPlay.classList.remove('playing');
      }
    }
    if (audioStatus) {
      audioStatus.textContent = playing ? 'RUNNING' : 'SUSPENDED';
    }
  }

  function evaluateCurrentCode() {
    // Force resume any Web Audio Context attached to window or audio elements
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (window.__swirlAudioCtx && window.__swirlAudioCtx.state === 'suspended') {
        window.__swirlAudioCtx.resume();
      } else if (!window.__swirlAudioCtx && AudioCtxClass) {
        window.__swirlAudioCtx = new AudioCtxClass();
        window.__swirlAudioCtx.resume();
      }
      if (typeof window.getAudioContext === 'function') {
        const actx = window.getAudioContext();
        if (actx && actx.state === 'suspended') {
          actx.resume();
        }
      }
    } catch (e) {
      console.warn('[AUDIO:RESUME] Context notice:', e.message);
    }

    // Trigger native Strudel evaluate event
    document.dispatchEvent(new CustomEvent('repl-evaluate'));

    const editor = getEditorInstance();
    if (editor) {
      try {
        if (typeof editor.evaluate === 'function') {
          editor.evaluate();
        } else if (typeof editor.start === 'function') {
          editor.start();
        }
        updateTransportUI(true);
        logToConsole('eval', 'Evaluated pattern and started audio transport.');
      } catch (err) {
        logToConsole('error', `Evaluation error: ${err.message}`);
        console.error('[SWIRL:EVAL]', err);
      }

      const currentCode = getEditorCode();
      if (vscode) {
        vscode.postMessage({
          command: 'evaluated',
          payload: {
            code: currentCode
          }
        });
      }
    }
  }

  function updateInPlace() {
    document.dispatchEvent(new CustomEvent('repl-evaluate'));
    const editor = getEditorInstance();
    if (editor) {
      if (typeof editor.evaluate === 'function') {
        editor.evaluate();
      }
      logToConsole('eval', 'Hot-updated pattern in place.');
      showToast('Pattern updated!');
    }
  }

  function stopAudio() {
    document.dispatchEvent(new CustomEvent('repl-stop'));
    const editor = getEditorInstance();
    if (editor && typeof editor.stop === 'function') {
      editor.stop();
    }
    updateTransportUI(false);
    logToConsole('system', 'Audio transport stopped.');

    if (vscode) {
      vscode.postMessage({ command: 'stopped' });
    }
  }

  function togglePlayStop() {
    if (isPlaying) {
      stopAudio();
    } else {
      evaluateCurrentCode();
    }
  }

  // Header Button Listeners
  if (btnPlay) {
    btnPlay.addEventListener('click', togglePlayStop);
  }
  if (btnUpdate) {
    btnUpdate.addEventListener('click', updateInPlace);
  }
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      const code = getEditorCode();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          showToast('Code copied to clipboard!');
          logToConsole('system', 'Pattern code copied to clipboard.');
        }).catch(() => {
          showToast('Could not access clipboard.');
        });
      } else {
        showToast('Clipboard API not available.');
      }
    });
  }

  // Drawer Toggle & Navigation
  function toggleDrawer() {
    if (!drawer) return;
    drawer.classList.toggle('hidden');
  }

  function openDrawerTab(tabId) {
    if (!drawer) return;
    drawer.classList.remove('hidden');

    tabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    tabPanes.forEach((pane) => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });
  }

  if (btnMenu) {
    btnMenu.addEventListener('click', toggleDrawer);
  }
  if (btnLearn) {
    btnLearn.addEventListener('click', () => openDrawerTab('patterns'));
  }
  const btnHeaderSettings = document.getElementById('btn-header-settings');
  if (btnHeaderSettings) {
    btnHeaderSettings.addEventListener('click', () => openDrawerTab('settings'));
  }
  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', () => {
      if (drawer) drawer.classList.add('hidden');
    });
  }

  // Tab Switch Buttons
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      openDrawerTab(tabId);
    });
  });

  // Inline links within drawer tabs
  document.querySelectorAll('.inline-tab-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.dataset.tab;
      if (tabId) openDrawerTab(tabId);
    });
  });

  // Patterns Presets Loader
  document.querySelectorAll('.btn-load-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      const editor = getEditorInstance();
      if (editor && code) {
        if (typeof editor.setCode === 'function') {
          editor.setCode(code);
        } else {
          editor.code = code;
        }
        showToast('Preset loaded into editor!');
        logToConsole('system', `Preset loaded: ${code.slice(0, 35)}...`);
      }
    });
  });

  // Export Tab Actions
  const btnExportCopy = document.getElementById('btn-export-copy');
  const btnExportStrudel = document.getElementById('btn-export-download-strudel');
  const btnExportJs = document.getElementById('btn-export-download-js');

  if (btnExportCopy) {
    btnExportCopy.addEventListener('click', () => {
      const code = getEditorCode();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => showToast('Copied to clipboard!'));
      }
    });
  }

  if (btnExportStrudel) {
    btnExportStrudel.addEventListener('click', () => {
      const code = getEditorCode();
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pattern.strudel';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded pattern.strudel');
    });
  }

  if (btnExportJs) {
    btnExportJs.addEventListener('click', () => {
      const code = getEditorCode();
      const content = `// Strudel Pattern Export\n// Generated by Strudel Local\n\n${code}\n`;
      const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pattern.js';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded pattern.js');
    });
  }

  // Console Clear
  if (btnClearConsole) {
    btnClearConsole.addEventListener('click', () => {
      if (consoleOutput) {
        consoleOutput.innerHTML = '<div class="console-line system">[SYSTEM] Console cleared.</div>';
      }
    });
  }

  // Settings Handlers
  const settingFontSize = document.getElementById('setting-font-size');
  const settingLineWrap = document.getElementById('setting-line-wrap');

  if (settingFontSize) {
    settingFontSize.addEventListener('change', (e) => {
      const size = Number(e.target.value);
      const editor = getEditorInstance();
      if (editor && typeof editor.setFontSize === 'function') {
        editor.setFontSize(size);
      }
      const cmEditor = document.querySelector('.cm-editor');
      if (cmEditor) {
        cmEditor.style.fontSize = `${size}px`;
      }
      logToConsole('system', `Editor font size set to ${size}px`);
    });
  }

  if (settingLineWrap) {
    settingLineWrap.addEventListener('change', (e) => {
      const wrap = e.target.value === 'true';
      const editor = getEditorInstance();
      if (editor && typeof editor.setLineWrappingEnabled === 'function') {
        editor.setLineWrappingEnabled(wrap);
      }
      logToConsole('system', `Line wrapping ${wrap ? 'enabled' : 'disabled'}`);
    });
  }

  // Synchronize status with editor events
  const strudelEditorEl = document.querySelector('strudel-editor');
  if (strudelEditorEl) {
    strudelEditorEl.addEventListener('update', (event) => {
      const state = event.detail;
      if (state && state.playing !== undefined) {
        updateTransportUI(state.playing);
      }
    });
  }

  // Keyboard Shortcuts: Ctrl+Enter / Cmd+Enter to Evaluate, Shift+Enter to Update, Ctrl+. / Cmd+. to Stop, Escape to Close Drawer
  window.addEventListener('keydown', (e) => {
    const isModifier = e.ctrlKey || e.metaKey;
    if (isModifier && e.key === 'Enter') {
      evaluateCurrentCode();
    } else if (e.shiftKey && e.key === 'Enter' && !isModifier) {
      updateInPlace();
    } else if (isModifier && e.key === '.') {
      e.preventDefault();
      stopAudio();
    } else if (e.key === 'Escape') {
      if (drawer && !drawer.classList.contains('hidden')) {
        drawer.classList.add('hidden');
      }
    }
  });

  // Listen to messages from VS Code Extension Host
  window.addEventListener('message', (event) => {
    const message = event.data;
    if (!message) return;
    const editor = getEditorInstance();

    switch (message.command) {
      case 'setCode':
        if (editor && typeof editor.setCode === 'function') {
          editor.setCode(message.code);
        }
        break;
      case 'evaluate':
        if (editor) {
          if (message.code && typeof editor.setCode === 'function') {
            editor.setCode(message.code);
          }
          evaluateCurrentCode();
        }
        break;
      case 'stop':
        stopAudio();
        break;
    }
  });

  // Initialize Dynamic Drawer Catalogs (Reference, Sounds, Patterns)
  if (typeof window.initDrawerExtension === 'function') {
    window.initDrawerExtension({
      getEditorInstance,
      getEditorCode,
      showToast,
      logToConsole
    });
  }

  // Initialize Comprehensive Settings & Theme Switcher (37 Themes)
  if (typeof window.initSettingsController === 'function') {
    window.initSettingsController({
      getEditorInstance,
      getEditorCode,
      showToast,
      logToConsole
    });
  }

  // Notify extension host that webview is ready
  if (vscode) {
    vscode.postMessage({ command: 'ready' });
  }
})();

