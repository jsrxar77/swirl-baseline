/**
 * Swirl REPL - Electron Desktop Host
 * Launches Swirl standalone REPL inside a native desktop window with full offline audio support.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

// Bypass Chromium autoplay restrictions so Web Audio starts without gestures
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-background-timer-throttling');

const PORT = parseInt(process.env.SWIRL_PORT || '3000', 10);
const HOST = '127.0.0.1';
let serverInstance = null;

function ensureServer(callback) {
  const req = http.get(`http://${HOST}:${PORT}`, (res) => {
    // Standalone server is already running on port
    callback();
  });

  req.on('error', () => {
    // Port not active, start the standalone server
    try {
      serverInstance = require('../standalone/server.js');
      setTimeout(callback, 300);
    } catch (err) {
      console.error('[ELECTRON] Error launching internal server:', err);
      callback();
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: 'Swirl REPL (Desktop)',
    backgroundColor: '#0d0f18',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false
    }
  });

  win.loadURL(`http://${HOST}:${PORT}/`);

  win.on('closed', () => {
    if (serverInstance && typeof serverInstance.close === 'function') {
      try {
        serverInstance.close();
      } catch (_) {}
    }
  });
}

app.whenReady().then(() => {
  ensureServer(() => {
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverInstance && typeof serverInstance.close === 'function') {
    try {
      serverInstance.close();
    } catch (_) {}
  }
  app.quit();
});
