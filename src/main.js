"use strict";
const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("node:path");
const started = require("electron-squirrel-startup");
if (started) {
  app.quit();
}
const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  
  const mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    backgroundColor: "#00000000",
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    skipTaskbar: true,
    fullscreen: false,
    // NOTE: setVisibleOnAllWorkspaces is NOT a constructor option; removed here.
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: false
    }
  });
  
  // Make window fullscreen
  mainWindow.setFullScreen(true);
  
  // Enable click-through by default
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  
  // Handle IPC calls to toggle mouse event ignoring
  ipcMain.handle('set-ignore-mouse-events', (event, ignore, forward) => {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: forward || false });
  });
  
  try {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (_) {
  }
  {
    mainWindow.loadURL("http://localhost:5173");
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