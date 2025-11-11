const { app, BrowserWindow, screen } = require('electron');
const path = require('node:path');
const started = require('electron-squirrel-startup');

if (started) {
  app.quit();
}

// Initial window size (will be adjusted to content)
const INITIAL_WIDTH = 500;
const INITIAL_HEIGHT = 210;

function getCenteredXPosition(winWidth) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  return Math.round(workArea.x + (workArea.width - winWidth) / 2);
}

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  const x = getCenteredXPosition(INITIAL_WIDTH);
  const y = Math.round(workArea.y); // Fixed top position

  const mainWindow = new BrowserWindow({
    width: INITIAL_WIDTH,
    height: INITIAL_HEIGHT,
    x,
    y,
    backgroundColor: '#00000000',
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    roundedCorners: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: false,
    },
  });

  try {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (_) {
    // Best-effort; ignore if platform/WM does not support this
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Store the fixed top Y position - never changes
  const fixedTopY = y;
  let lastContentSize = { width: 0, height: 0 };
  let lastPositionedWidth = INITIAL_WIDTH; // Track last width for repositioning
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

      // Only update if size changed
      if (contentSize.width !== lastContentSize.width || 
          contentSize.height !== lastContentSize.height) {
        
        lastContentSize = { width: contentSize.width, height: contentSize.height };
        
        // Resize window (height changes grow downward from fixed top)
        mainWindow.setSize(contentSize.width, contentSize.height, false);
        
        // Only reposition horizontally if width changed (keep Y fixed at top)
        const widthChanged = Math.abs(contentSize.width - lastPositionedWidth) >= 1;
        if (widthChanged) {
          const centeredX = getCenteredXPosition(contentSize.width);
          mainWindow.setPosition(centeredX, fixedTopY);
          lastPositionedWidth = contentSize.width;
        }
      }
      
    } catch (error) {
      // Silently handle errors
    }
  };

  // Fast polling to catch changes instantly
  const startSizeMonitoring = () => {
    if (sizeCheckInterval) {
      clearInterval(sizeCheckInterval);
      sizeCheckInterval = null;
    }
    
    // Poll at 60fps for instant detection
    const CHECK_INTERVAL = 16;
    
    sizeCheckInterval = setInterval(() => {
      adjustWindowToContent();
    }, CHECK_INTERVAL);
    
    adjustWindowToContent();
  };

  mainWindow.webContents.on('did-finish-load', () => {
    adjustWindowToContent();
    setTimeout(() => adjustWindowToContent(), 8);
    setTimeout(() => adjustWindowToContent(), 16);
    setTimeout(() => {
      startSizeMonitoring();
    }, 50);
  });

  mainWindow.webContents.on('dom-ready', () => {
    setTimeout(() => adjustWindowToContent(), 8);
  });

  mainWindow.on('closed', () => {
    if (sizeCheckInterval) {
      clearInterval(sizeCheckInterval);
      sizeCheckInterval = null;
    }
  });

  const recenter = () => {
    const [currentWidth, currentHeight] = mainWindow.getSize();
    // Keep Y position fixed at top, only adjust X for horizontal centering
    const centeredX = getCenteredXPosition(currentWidth);
    mainWindow.setPosition(centeredX, fixedTopY);
  };

  screen.on('display-metrics-changed', recenter);
  screen.on('display-added', recenter);
  screen.on('display-removed', recenter);

  mainWindow.on('show', () => {
    recenter();
    adjustWindowToContent();
    setTimeout(() => adjustWindowToContent(), 16);
  });
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