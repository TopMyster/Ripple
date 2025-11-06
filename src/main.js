import { app, BrowserWindow, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

if (started) {
  app.quit();
}

const WINDOW_WIDTH = 500;
const WINDOW_HEIGHT = 210;

function getTopCenterPosition(winWidth, winHeight) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;

  const x = Math.round(workArea.x + (workArea.width - winWidth) / 2);
  const y = Math.round(workArea.y);

  return { x, y };
}

const createWindow = () => {
  const { x, y } = getTopCenterPosition(WINDOW_WIDTH, WINDOW_HEIGHT);

  const mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x,
    y,
    backgroundColor: '#00000000',
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    skipTaskbar: true, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  const recenter = () => {
    const pos = getTopCenterPosition(WINDOW_WIDTH, WINDOW_HEIGHT);
    mainWindow.setPosition(pos.x, pos.y);
  };

  screen.on('display-metrics-changed', recenter);
  screen.on('display-added', recenter);
  screen.on('display-removed', recenter);

  mainWindow.on('show', recenter);
};

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
