import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow;
let currentFilePath = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'renderer', 'images', 'app_icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        },
        maximised: true
    });

    mainWindow.maximize();

    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    createMenu(mainWindow);
    // mainWindow.webContents.openDevTools(); // Open DevTools to capture preload console output
}

function createMenu(mainWindow) {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        currentFilePath = null;
                        mainWindow.webContents.send('file:new');
                    }
                },
                {
                    label: 'Open',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile'],
                            filters: [{ name: 'HeroQuest Maps', extensions: ['hqm'] }]
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            const filePath = result.filePaths[0];
                            currentFilePath = filePath;
                            const data = fs.readFileSync(filePath, 'utf-8');

                            mainWindow.webContents.send('file:open', { path: filePath, data: data });
                        }
                    }
                },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: async () => {
                        if (!currentFilePath) {
                            await saveAs();
                            return;
                        }

                        const data = await mainWindow.webContents.executeJavaScript('window.api._getMapData()', true);
                        fs.writeFileSync(currentFilePath, data, 'utf-8');
                    }
                },
                { 
                    label: 'Save As...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: saveAs
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    role: 'quit'
                }
            ]
        }
    ]

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function saveAs() {
    const result = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'HeroQuest Maps', extensions: ['hqm'] }]
    });

    if (!result.canceled && result.filePath) {
        const data = await mainWindow.webContents.executeJavaScript('window.api._getMapData()', true);
        fs.writeFileSync(result.filePath, data, 'utf-8');
        currentFilePath = result.filePath;
    }
}

ipcMain.handle('file:getData', async () => {
    return await mainWindow.webContents.executeJavaScript('window.api._getMapData()', true);
});

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});