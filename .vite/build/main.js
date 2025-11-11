"use strict";
const { app, BrowserWindow, screen } = require("electron");
const path = require("node:path");
const started = require("electron-squirrel-startup");
if (started) {
  app.quit();
}
const WINDOW_WIDTH = 420;
const WINDOW_HEIGHT = 210;
function getTopCenterPosition(winWidth, winHeight) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  const x = Math.round(workArea.x + (workArea.width - winWidth) / 2);
  const y = Math.round(workArea.y);
  return { x, y };
}
const createWindow = () => {
  const { x, y } = getTopCenterPosition(WINDOW_WIDTH);
  const mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x,
    y,
    backgroundColor: "#00000000",
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    skipTaskbar: true,
    // NOTE: setVisibleOnAllWorkspaces is NOT a constructor option; removed here.
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
  const recenter = () => {
    const pos = getTopCenterPosition(WINDOW_WIDTH);
    mainWindow.setPosition(pos.x, pos.y);
  };
  screen.on("display-metrics-changed", recenter);
  screen.on("display-added", recenter);
  screen.on("display-removed", recenter);
  mainWindow.on("show", recenter);
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
