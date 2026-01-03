const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let getMapDataFn = null;

try {
  contextBridge.exposeInMainWorld('api', {
    readBorders() {
      const bordersPath = path.join(__dirname, '..', 'data', 'cellBorders.json');
      const data = fs.readFileSync(bordersPath, 'utf-8');
      return JSON.parse(data);
    },

    getMonsterIcons() {
      const iconsPath = path.join(__dirname, '..', 'src', 'renderer', 'images', 'monsters');
      const files = fs.readdirSync(iconsPath);
      return files.filter(file => file.endsWith('.png'));
    },

    getTrapIcons() {
      const iconsPath = path.join(__dirname, '..', 'src', 'renderer', 'images', 'traps');
      const files = fs.readdirSync(iconsPath);
      return files.filter(file => file.endsWith('.png'));
    },

    getSpecialIcons() {
      const iconsPath = path.join(__dirname, '..', 'src', 'renderer', 'images', 'special');
      const files = fs.readdirSync(iconsPath);
      return files.filter(file => file.endsWith('.png'));
    },

    getRubbleIcons() {
      const iconsPath = path.join(__dirname, '..', 'src', 'renderer', 'images', 'rubble');
      const files = fs.readdirSync(iconsPath);
      return files.filter(file => file.endsWith('.png'));
    },

    getFurnitureIcons() {
      const iconsPath = path.join(__dirname, '..', 'src', 'renderer', 'images', 'furniture');
      const files = fs.readdirSync(iconsPath);
      return files.filter(file => file.endsWith('.png'));
    },

    onNew: (fn) => { ipcRenderer.on('file:new', fn); },
    onOpen: (fn) => { ipcRenderer.on('file:open', fn); },
    getData: () => { ipcRenderer.invoke('file:getData'); },

    registerGetMapData: (fn) => {
      getMapDataFn = fn;
    },

    _getMapData: () => {
      if (!getMapDataFn) return '{}';
      return getMapDataFn();
    },

    // Return persisted user preferences (reads user-preferences.json from userData)
    getPrefs: async () => {
      try {
        const userData = await ipcRenderer.invoke('app:getUserDataPath');
        const prefsFile = path.join(userData, 'user-preferences.json');
        if (fs.existsSync(prefsFile)) {
          return JSON.parse(fs.readFileSync(prefsFile, 'utf8')) || {};
        }
      } catch (e) {
        // ignore read errors
      }
      return {};
    },
    // Persist arbitrary prefs (merges with existing), and apply theme immediately
    setPrefs: async (prefsObj) => {
      try {
        const userData = await ipcRenderer.invoke('app:getUserDataPath');
        const prefsFile = path.join(userData, 'user-preferences.json');
        let existing = {};
        try { existing = JSON.parse(fs.readFileSync(prefsFile, 'utf8')) || {}; } catch (e) { /* ignore */ }
        const merged = Object.assign({}, existing, prefsObj || {});
        fs.mkdirSync(userData, { recursive: true });
        fs.writeFileSync(prefsFile, JSON.stringify(merged, null, 2), 'utf8');

        // apply theme immediately if provided
        if (merged.theme) {
          const apply = () => {
            try { document.body.setAttribute('data-theme', merged.theme); } catch (e) { /* ignore */ }
          };
          if (typeof document !== 'undefined' && document.body) apply(); else window.addEventListener('DOMContentLoaded', apply);
        }
        return merged;
      } catch (e) {
        return null;
      }
    },

    setDarkTheme: () => {
      ipcRenderer.on('theme:dark', () => {
        document.body.setAttribute('data-theme', 'dark');
      });
    },

    setLightTheme: () => {
      ipcRenderer.on('theme:light', () => {
        document.body.setAttribute('data-theme', 'light');
      });
    }
  });
  // Also register theme handlers immediately so menu clicks are effective
  // even if renderer never calls `setDarkTheme` / `setLightTheme`.
  try {
    const applyOrQueue = (fn) => {
      if (typeof document !== 'undefined' && document.body) {
        fn();
      } else {
        window.addEventListener('DOMContentLoaded', fn);
      }
    };

    const saveThemePref = async (theme) => {
      try {
        const userData = await ipcRenderer.invoke('app:getUserDataPath');
        const prefsFile = path.join(userData, 'user-preferences.json');
        let prefs = {};
        try { prefs = JSON.parse(fs.readFileSync(prefsFile, 'utf8')); } catch (e) { /* ignore */ }
        prefs.theme = theme;
        fs.mkdirSync(userData, { recursive: true });
        fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2), 'utf8');
      } catch (e) {
        // ignore write errors
      }
    };

    ipcRenderer.on('theme:dark', () => {
      applyOrQueue(() => {
        document.body.setAttribute('data-theme', 'dark');
      });
      saveThemePref('dark');
    });

    ipcRenderer.on('theme:light', () => {
      applyOrQueue(() => {
        document.body.setAttribute('data-theme', 'light');
      });
      saveThemePref('light');
    });

    // Load persisted prefs at preload time and apply theme if present
    (async () => {
      try {
        const userData = await ipcRenderer.invoke('app:getUserDataPath');
        const prefsFile = path.join(userData, 'user-preferences.json');
        if (fs.existsSync(prefsFile)) {
          const prefs = JSON.parse(fs.readFileSync(prefsFile, 'utf8')) || {};
          if (prefs.theme) {
            applyOrQueue(() => document.body.setAttribute('data-theme', prefs.theme));
          }
        }
      } catch (e) {
        // ignore read errors
      }
    })();
  } catch (e) {
    // ignore if DOM/window not available
  }
} catch (err) {
  try {
    const out = (err && err.stack) ? err.stack : String(err);
    fs.writeFileSync(path.join(__dirname, '..', 'preload-error.txt'), out, 'utf8');
  } catch (e) {
    // ignore write errors
  }
  throw err;
}
