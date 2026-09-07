/**
 * Strudel Local - Extension Host Backend
 * Manages WebviewPanel lifecycle, commands, and IPC bridge for Antigravity IDE / VS Code.
 */

let vscode;
try {
  vscode = require('vscode');
} catch (e) {
  // Graceful fallback when executed outside VS Code extension host runtime
  vscode = null;
}

const fs = require('fs');
const path = require('path');

let currentPanel = null;

function activate(context) {
  if (!vscode) return;

  const openReplCommand = vscode.commands.registerCommand('swirl.openRepl', () => {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (currentPanel) {
      currentPanel.reveal(column);
      return;
    }

    currentPanel = vscode.window.createWebviewPanel(
      'swirlRepl',
      'Swirl REPL',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(context.extensionPath)
        ]
      }
    );

    currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionPath);

    // Handle messages from the Webview
    currentPanel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'evaluated':
            vscode.window.setStatusBarMessage(
              `Swirl: Pattern evaluated (${message.payload.eventsCount} events)`,
              2500
            );
            break;
          case 'stopped':
            vscode.window.setStatusBarMessage('Swirl: Playback stopped', 2000);
            break;
          case 'error':
            vscode.window.showErrorMessage(`Swirl Error: ${message.payload.message || 'Unknown Webview error'}`);
            break;
          case 'ready':
            // If there is an active editor with text, sync it
            if (vscode.window.activeTextEditor) {
              const text = vscode.window.activeTextEditor.document.getText();
              if (text.trim().length > 0) {
                currentPanel.webview.postMessage({ command: 'setCode', code: text });
              }
            }
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    currentPanel.onDidDispose(
      () => {
        currentPanel = null;
      },
      null,
      context.subscriptions
    );
  });

  const evaluateSelectionCommand = vscode.commands.registerCommand('swirl.evaluateSelection', () => {
    if (!currentPanel) {
      vscode.commands.executeCommand('swirl.openRepl').then(() => {
        sendActiveEditorSelection();
      });
    } else {
      sendActiveEditorSelection();
    }
  });

  function sendActiveEditorSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !currentPanel) return;

    const selection = editor.selection;
    const text = selection.isEmpty
      ? editor.document.lineAt(selection.active.line).text
      : editor.document.getText(selection);

    if (text.trim().length > 0) {
      currentPanel.webview.postMessage({
        command: 'evaluate',
        code: text
      });
    }
  }

  // Create clickable Status Bar button
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'swirl.openRepl';
  statusBarItem.text = '$(play-circle) Swirl';
  statusBarItem.tooltip = 'Abrir Swirl REPL (Offline 100%)';
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(openReplCommand);
  context.subscriptions.push(evaluateSelectionCommand);
}

function getWebviewContent(webview, extensionPath) {
  // Locate html template
  let htmlPath = path.join(extensionPath, 'dist', 'webview', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    htmlPath = path.join(extensionPath, 'src', 'webview', 'index.html');
  }

  let html = fs.readFileSync(htmlPath, 'utf8');

  // Determine resource directory (dist or src)
  const baseDir = fs.existsSync(path.join(extensionPath, 'dist', 'webview'))
    ? path.join(extensionPath, 'dist', 'webview')
    : path.join(extensionPath, 'src', 'webview');

  const baseUri = webview.asWebviewUri(vscode.Uri.file(baseDir));
  const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(baseDir, 'main.js')));
  const strudelReplUri = webview.asWebviewUri(vscode.Uri.file(path.join(baseDir, 'strudel-repl.js')));
  const drawerUri = webview.asWebviewUri(vscode.Uri.file(path.join(baseDir, 'modules', 'drawer-extension.js')));
  const settingsUri = webview.asWebviewUri(vscode.Uri.file(path.join(baseDir, 'modules', 'settings-controller.js')));
  const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(baseDir, 'style.css')));

  // Replace Content Security Policy meta tag to strictly allow webview.cspSource
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data: blob:; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval' blob:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource} data:; worker-src ${webview.cspSource} blob:; connect-src ${webview.cspSource} data: blob:;">`;
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, cspMeta);

  // Inject base tag inside head
  html = html.replace('<head>', `<head>\n  <base href="${baseUri}/">`);

  // Replace all script and style paths with webview URIs
  html = html.replace('href="style.css"', `href="${styleUri}"`);
  html = html.replace('src="strudel-repl.js"', `src="${strudelReplUri}"`);
  html = html.replace('src="modules/drawer-extension.js"', `src="${drawerUri}"`);
  html = html.replace('src="modules/settings-controller.js"', `src="${settingsUri}"`);
  html = html.replace('src="main.js"', `src="${scriptUri}"`);

  // Pre-inject catalog data into window.__STRUDEL_*__ for instant synchronous availability
  const themesPath = path.join(baseDir, 'data', 'themes.json');
  const refPath = path.join(baseDir, 'data', 'reference.json');
  const soundsPath = path.join(baseDir, 'data', 'sounds.json');
  const patternsPath = path.join(baseDir, 'data', 'patterns.json');

  let dataScript = '<script>\n';
  try {
    if (fs.existsSync(themesPath)) dataScript += `window.__STRUDEL_THEMES__ = ${fs.readFileSync(themesPath, 'utf8')};\n`;
    if (fs.existsSync(refPath)) dataScript += `window.__STRUDEL_REFERENCE__ = ${fs.readFileSync(refPath, 'utf8')};\n`;
    if (fs.existsSync(soundsPath)) dataScript += `window.__STRUDEL_SOUNDS__ = ${fs.readFileSync(soundsPath, 'utf8')};\n`;
    if (fs.existsSync(patternsPath)) dataScript += `window.__STRUDEL_PATTERNS__ = ${fs.readFileSync(patternsPath, 'utf8')};\n`;
  } catch (err) {
    console.warn('[WEBVIEW:DATA] Preload notice:', err.message);
  }
  dataScript += '</script>';

  html = html.replace('</head>', `${dataScript}\n</head>`);

  return html;
}

function deactivate() {
  if (currentPanel) {
    currentPanel.dispose();
    currentPanel = null;
  }
}

module.exports = {
  activate,
  deactivate
};
