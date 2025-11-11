"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  setIgnoreMouseEvents: (ignore, forward) => {
    ipcRenderer.invoke("set-ignore-mouse-events", ignore, forward);
  }
});
