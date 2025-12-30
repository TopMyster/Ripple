"use strict";
const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("fs");
const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  const mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    backgroundColor: "#00000000",
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    titleBarStyle: "hidden",
    type: "toolbar",
    backgroundMaterial: "none",
    skipTaskbar: true,
    fullscreen: false,
    visibleOnFullScreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: false
    }
  });
  mainWindow.setFullScreen(true);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  ipcMain.handle("set-ignore-mouse-events", (event, ignore, forward) => {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: forward || false });
  });
  try {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (_) {
  }
  if (!app.isPackaged || process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const possiblePaths = [
      path.join(__dirname, "../renderer/main_window/index.html"),
      path.join(__dirname, "../.vite/renderer/main_window/index.html"),
      path.join(process.resourcesPath, "app/.vite/renderer/main_window/index.html"),
      path.join(process.resourcesPath, "app/renderer/main_window/index.html")
    ];
    let loaded = false;
    for (const rendererPath of possiblePaths) {
      try {
        if (fs.existsSync(rendererPath)) {
          mainWindow.loadFile(rendererPath);
          loaded = true;
          break;
        }
      } catch (e) {
      }
    }
    if (!loaded) {
      console.error("Could not find renderer HTML file. Tried paths:", possiblePaths);
    }
  }
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
