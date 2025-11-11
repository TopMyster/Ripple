"use strict";
const { app, BrowserWindow, screen } = require("electron");
const path = require("node:path");
const started = require("electron-squirrel-startup");
if (started) {
  app.quit();
}
const INITIAL_WIDTH = 500;
const INITIAL_HEIGHT = 210;
function getTopCenterPosition(winWidth, winHeight) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  const x = Math.round(workArea.x + (workArea.width - winWidth) / 2);
  const y = Math.round(workArea.y);
  return { x, y };
}
const createWindow = () => {
  const { x, y } = getTopCenterPosition(INITIAL_WIDTH);
  const mainWindow = new BrowserWindow({
    width: INITIAL_WIDTH,
    height: INITIAL_HEIGHT,
    x,
    y,
    backgroundColor: "#00000000",
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    roundedCorners: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: false
    }
  });
  try {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (_) {
  }
  {
    mainWindow.loadURL("http://localhost:5173");
  }
  let lastContentSize = { width: 0, height: 0 };
  let sizeCheckInterval = null;
  const adjustWindowToContent = async () => {
    try {
      const contentSize = await mainWindow.webContents.executeJavaScript(`
        (() => {
          const island = document.getElementById('Island');
          if (!island) return null;
          
          const rect = island.getBoundingClientRect();
          
          return {
            width: Math.ceil(rect.width) + 30,
            height: Math.ceil(rect.height) + 30
          };
        })()
      `);
      if (!contentSize || contentSize.width <= 0 || contentSize.height <= 0) {
        return;
      }
      if (contentSize.width !== lastContentSize.width || contentSize.height !== lastContentSize.height) {
        lastContentSize = { width: contentSize.width, height: contentSize.height };
        mainWindow.setSize(contentSize.width, contentSize.height, false);
        const pos = getTopCenterPosition(contentSize.width, contentSize.height);
        mainWindow.setPosition(pos.x, pos.y);
      }
    } catch (error) {
    }
  };
  const startSizeMonitoring = () => {
    if (sizeCheckInterval) {
      clearInterval(sizeCheckInterval);
      sizeCheckInterval = null;
    }
    const CHECK_INTERVAL = 16;
    sizeCheckInterval = setInterval(() => {
      adjustWindowToContent();
    }, CHECK_INTERVAL);
    adjustWindowToContent();
  };
  mainWindow.webContents.on("did-finish-load", () => {
    adjustWindowToContent();
    setTimeout(() => adjustWindowToContent(), 8);
    setTimeout(() => adjustWindowToContent(), 16);
    setTimeout(() => {
      startSizeMonitoring();
    }, 50);
  });
  mainWindow.webContents.on("dom-ready", () => {
    setTimeout(() => adjustWindowToContent(), 8);
  });
  mainWindow.on("closed", () => {
    if (sizeCheckInterval) {
      clearInterval(sizeCheckInterval);
      sizeCheckInterval = null;
    }
  });
  const recenter = () => {
    const [currentWidth, currentHeight] = mainWindow.getSize();
    const pos = getTopCenterPosition(currentWidth);
    mainWindow.setPosition(pos.x, pos.y);
  };
  screen.on("display-metrics-changed", recenter);
  screen.on("display-added", recenter);
  screen.on("display-removed", recenter);
  mainWindow.on("show", () => {
    recenter();
    adjustWindowToContent();
    setTimeout(() => adjustWindowToContent(), 16);
  });
};
app.whenReady().then(() => {
  if (process.platform === "darwin") {
    app.dock.hide();
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
