"use strict";
const { app, BrowserWindow, screen, ipcMain, shell, Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");
const fs = require("fs");

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('disable-gpu-compositing');
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

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('launch-app', async (event, appName) => {
  const platform = process.platform;
  if (platform === 'darwin') {
    exec(`open -a "${appName}"`);
  } else if (platform === 'win32') {
    exec(`start "" "${appName}"`);
  } else {
    exec(appName);
  }
});

ipcMain.handle('get-displays', () => {
  const displays = screen.getAllDisplays();
  return displays.map(d => ({
    id: d.id,
    label: d.label || `Display ${d.id}`,
    bounds: d.bounds
  }));
});

ipcMain.handle('set-display', (event, displayId) => {
  if (mainWindow) {
    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(d => d.id.toString() === displayId.toString()) || screen.getPrimaryDisplay();

    const { x, y, width, height } = targetDisplay.bounds;
    const isLinux = process.platform === 'linux';

    mainWindow.setBounds({ x, y, width, height });
    if (!isLinux) {
      mainWindow.setFullScreen(true);
    }

    mainWindow.show();
  }
});

ipcMain.handle('update-window-position', (event, xPerc, yPx) => {
  // Logic handled by React state when window is full screen
});

ipcMain.handle('set-auto-launch', (event, enable) => {
  if (process.platform === 'linux') {
    const autostartPath = path.join(app.getPath('home'), '.config', 'autostart');
    const desktopFilePath = path.join(autostartPath, 'ripple.desktop');

    try {
      if (enable) {
        if (!fs.existsSync(autostartPath)) {
          fs.mkdirSync(autostartPath, { recursive: true });
        }
        const desktopFileContent = `[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${app.getPath('exe')}"
Icon=${getIconPath()}
Terminal=false
`;
        fs.writeFileSync(desktopFilePath, desktopFileContent);
      } else {
        if (fs.existsSync(desktopFilePath)) {
          fs.unlinkSync(desktopFilePath);
        }
      }
    } catch (e) {
      console.error('Failed to set auto-launch on Linux:', e);
    }
  } else if (process.platform === 'win32') {
    try {
      app.setLoginItemSettings({
        openAtLogin: enable,
        path: app.getPath('exe'),
      });
    } catch (e) {
      console.error('Failed to set login item settings on Windows:', e);
    }
  }
});

const getIconPath = () => {
  const ext = 'png';
  if (app.isPackaged) {
    const resPath = path.join(process.resourcesPath, `icon.${ext}`);
    const assetsPath = path.join(process.resourcesPath, `assets/icons/icon.${ext}`);

    if (fs.existsSync(resPath)) return resPath;
    if (fs.existsSync(assetsPath)) return assetsPath;

    return resPath;
  }
  return path.join(__dirname, `../../src/assets/icons/icon.${ext}`);
};

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;
  const isLinux = process.platform === 'linux';
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  const winWidth = width;
  const winHeight = height;
  const winX = x;
  const winY = y;

  // 'type' option is only supported on macOS ('toolbar') and Linux ('dock'); not Windows
  const windowType = isWindows ? undefined : 'toolbar';

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: winX,
    y: winY,
    backgroundColor: "#00000000",
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    // thickFrame: false breaks transparent windows on Windows
    ...(isWindows ? {} : { thickFrame: false }),
    hasShadow: false,
    skipTaskbar: true,
    icon: getIconPath(),
    // hiddenInMissionControl is a macOS-only option
    ...(isMac ? { hiddenInMissionControl: true } : {}),
    // type is not supported on Windows
    ...(windowType ? { type: windowType } : {}),
    fullscreen: false,
    visibleOnFullScreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: false
    },
    show: false
  });

  if (!isLinux) {
    mainWindow.setFullScreen(true);
  }

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  const showDelay = isLinux ? 500 : 0;

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.show();
        if (isLinux) {
          mainWindow.setAlwaysOnTop(true, 'screen-saver');
        }
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

  try {
    const iconPath = getIconPath();
    const icon = nativeImage.createFromPath(iconPath);
    // Always resize specifically for the tray to ensure it fits the OS requirements (usually 16x16 or 32x32)
    const trayIcon = icon.resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show/Hide Ripple',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isVisible()) {
              mainWindow.hide();
            } else {
              mainWindow.show();
            }
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
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync().GetAwaiter().GetResult()
        $session = $manager.GetCurrentSession()
        if ($session) {
            $props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
            $playback = $session.GetPlaybackInfo()
            $status = $playback.PlaybackStatus
            $info = @{
                Title = $props.Title
                Artist = $props.Artist
                Album = $props.AlbumTitle
                Status = $status.ToString().ToLower()
                Source = $session.SourceAppId
            }
            return $info | ConvertTo-Json
        }
        return "null"
      `;
      exec(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, (error, stdout) => {
        if (error || !stdout || stdout.trim() === "null") {
          exec(`powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`, (err, out) => {
            if (err || !out) return resolve(null);
            const title = out.split('\n').find(l => l.includes('-'))?.trim();
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
          return;
        }

        try {
          const data = JSON.parse(stdout);
          resolve({
            name: data.Title || "Unknown Title",
            artist: data.Artist || "Unknown Artist",
            album: data.Album || "",
            state: data.Status === 'playing' ? 'playing' : 'paused',
            source: data.Source || 'System'
          });
        } catch (e) {
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

ipcMain.handle('get-bluetooth-status', async () => {
  return new Promise((resolve) => {
    const platform = process.platform;
    if (platform === 'darwin') {
      exec('system_profiler SPBluetoothDataType -json', (error, stdout) => {
        if (error) return resolve(false);
        try {
          const data = JSON.parse(stdout);
          const bluetoothData = data.SPBluetoothDataType[0];
          const hasConnectedDevices = bluetoothData.device_connected && bluetoothData.device_connected.length > 0;
          resolve(hasConnectedDevices);
        } catch (e) {
          resolve(false);
        }
      });
    } else if (platform === 'win32') {
      const psScript = `
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $devices = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType = WindowsRuntime]::FindAllAsync('(System.Devices.Aep.ProtocolId:="{e0cbf06c-5021-4943-9112-460f89956c33}") AND (System.Devices.Aep.IsConnected:=$true)').GetAwaiter().GetResult()
        return $devices.Count > 0
      `;
      exec(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, (error, stdout) => {
        if (error) return resolve(false);
        resolve(stdout.trim().toLowerCase() === 'true');
      });
    } else if (platform === 'linux') {
      exec('bluetoothctl devices Connected', (error, stdout) => {
        if (error) return resolve(false);
        resolve(stdout.trim().length > 0);
      });
    } else {
      resolve(false);
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