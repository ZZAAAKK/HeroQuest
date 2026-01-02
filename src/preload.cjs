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

    onNew: (fn) => { ipcRenderer.on('file:new', fn);  },
    onOpen: (fn) => { ipcRenderer.on('file:open', fn);  },
    getData: () => { ipcRenderer.invoke('file:getData'); },
    
    registerGetMapData: (fn) => {
      getMapDataFn = fn;
    },

    _getMapData: () => {
        if (!getMapDataFn) return '{}';
        return getMapDataFn();
    }
  });
} catch (err) {
  try {
    const out = (err && err.stack) ? err.stack : String(err);
    fs.writeFileSync(path.join(__dirname, '..', 'preload-error.txt'), out, 'utf8');
  } catch (e) {
    // ignore write errors
  }
  throw err;
}
