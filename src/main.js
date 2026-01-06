"use strict";
const { app, BrowserWindow, screen, ipcMain, shell, Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");
const fs = require("fs");

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.disableHardwareAcceleration();
}
let tray = null;
let mainWindow = null;

const { exec } = require('child_process');

ipcMain.handle('set-ignore-mouse-events', (event, ignore, forward) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: forward || false });
  }
});

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    backgroundColor: "#00000000",
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    thickFrame: false,
    hasShadow: false,
    skipTaskbar: true,
    hiddenInMissionControl: true,
    type: 'toolbar',
    fullscreen: false,
    visibleOnFullScreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: false
    },
    show: false
  });

  if (process.platform !== 'linux') {
    mainWindow.setFullScreen(true);
  }

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  const showDelay = process.platform === 'linux' ? 300 : 0;

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    }, showDelay);
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 5000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });



  try {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (_) {
  }

  if (!app.isPackaged || process.env.NODE_ENV === 'development') {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const rendererPath = path.join(__dirname, "../renderer/main_window/index.html");
    mainWindow.loadFile(rendererPath);
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

  const getIconPath = () => {
    const ext = process.platform === 'win32' ? 'ico' : 'png';
    if (app.isPackaged) {
      return path.join(process.resourcesPath, `assets/icons/icon.${ext}`);
    }
    return path.join(__dirname, `../../src/assets/icons/icon.${ext}`);
  };

  try {
    const icon = nativeImage.createFromPath(getIconPath());
    const trayIcon = process.platform === 'win32' ? icon : icon.resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Ripple',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
          }
        }
      },
      {
        label: 'Hide Ripple',
        click: () => {
          if (mainWindow) {
            mainWindow.hide();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);
    tray.setToolTip('Ripple');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      }
    });
  } catch (e) {
    console.error('Failed to create tray:', e);
  }
});

//Keep in mind that this part was made by AI



ipcMain.handle('get-system-media', async () => {
  return new Promise((resolve) => {
    const platform = process.platform;

    if (platform === 'darwin') {
      const script = `
            tell application "System Events"
                set spotifyRunning to (name of every process) contains "Spotify"
                set musicRunning to (name of every process) contains "Music"
            end tell
            if spotifyRunning then
                try
                    tell application "Spotify"
                        set mediaState to player state as string
                        set songName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                        try
                            set artUrl to artwork url of current track
                        on error
                            set artUrl to ""
                        end try
                    end tell
                    return "Spotify" & "||" & mediaState & "||" & songName & "||" & artistName & "||" & albumName & "||" & artUrl
                on error
                    return "Error"
                end try
            else if musicRunning then
                try
                    tell application "Music" 
                        set mediaState to player state as string
                        set songName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                    end tell
                    return "Music" & "||" & mediaState & "||" & songName & "||" & artistName & "||" & albumName & "||" & "" 
                on error
                    return "Error"
                end try
            else
                return "None"
            end if
            `;
      exec(`osascript -e '${script}'`, (error, stdout) => {
        if (error) {
          return resolve(null);
        }
        const output = stdout.trim();

        if (!output || output === "None" || output === "Error") return resolve(null);

        const parts = output.split('||');
        if (parts.length >= 4) {
          resolve({
            name: parts[2],
            artist: parts[3],
            album: parts[4],
            artwork_url: parts[5] || null,
            state: parts[1] === 'playing' ? 'playing' : 'paused',
            source: parts[0]
          });
        } else {
          resolve(null);
        }
      });

    } else if (platform === 'win32') {
      const psScript = `
             $media = [Windows.Media.Control.GlobalSystemMediaTransportControls,Windows.Media.Control,ContentType=WindowsRuntime].GetMethod("GetForCurrentView").Invoke($null, $null)
             $info = $media.GetTimelineProperties()
             # Note: Direct detailed access without compiled bindings is hard in raw PS. 
             # Fallback to pure window title checks for simplicity if direct media access fails
             Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object MainWindowTitle | ConvertTo-Json
             `;
      exec(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`, (error, stdout) => {
        if (error || !stdout) return resolve(null);
        const title = stdout.split('\n').find(l => l.includes('-'))?.trim();
        if (title) {
          const [artist, song] = title.split(' - ');
          resolve({
            name: song || title,
            artist: artist || "Unknown",
            state: 'playing',
            source: 'Spotify'
          });
        } else {
          resolve(null);
        }
      });

    } else if (platform === 'linux') {
      exec('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"', (err, stdout) => {
        if (err || !stdout) return resolve(null);
        const parts = stdout.trim().split('||');
        resolve({
          name: parts[0],
          artist: parts[1],
          album: parts[2],
          state: parts[3].toLowerCase(),
          source: 'System'
        });
      });
    } else {
      resolve(null);
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform === 'linux' && !tray) {
    app.quit();
  }
});

// System Media Controls Handler
ipcMain.handle('control-system-media', async (event, command) => {
  const platform = process.platform;
  if (platform === 'darwin') {
    const script = `
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${command} track
        else if musicRunning then
            tell application "Music" to ${command} track
        end if
        `;
    exec(`osascript -e '${script}'`);
  } else if (platform === 'linux') {
    let cmd = command;
    if (command === 'playpause') cmd = 'play-pause';
    exec(`playerctl ${cmd}`);
  }
});