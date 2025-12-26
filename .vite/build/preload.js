"use strict";const{contextBridge:o,ipcRenderer:r}=require("electron");o.exposeInMainWorld("electronAPI",{setIgnoreMouseEvents:(e,n)=>{r.invoke("set-ignore-mouse-events",e,n)}});
