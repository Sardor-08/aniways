const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");
const http = require("http");

// Handle creating/removing shortcuts on Windows when installing/uninstalling
try {
  if (require("electron-squirrel-startup")) {
    app.quit();
  }
} catch (e) {
  // electron-squirrel-startup not available in dev
}

let mainWindow;
let nextServer;
let backendServer;

// Detect if running in development mode
const isDev = !app.isPackaged;
const PORT = process.env.PORT || 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 4444;

console.log(`Starting Aniways in ${isDev ? "development" : "production"} mode`);

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.reloadIgnoringCache();
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Fullscreen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          }
        },
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Maximize',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              if (focusedWindow.isMaximized()) {
                focusedWindow.unmaximize();
              } else {
                focusedWindow.maximize();
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomLevel();
              focusedWindow.webContents.setZoomLevel(currentZoom + 0.5);
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomLevel();
              focusedWindow.webContents.setZoomLevel(currentZoom - 0.5);
            }
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.setZoomLevel(0);
            }
          }
        }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          click: (item, focusedWindow) => {
            if (focusedWindow && focusedWindow.webContents.canGoBack()) {
              focusedWindow.webContents.goBack();
            }
          }
        },
        {
          label: 'Forward',
          accelerator: 'Alt+Right',
          click: (item, focusedWindow) => {
            if (focusedWindow && focusedWindow.webContents.canGoForward()) {
              focusedWindow.webContents.goForward();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+H',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.loadURL(`http://localhost:${PORT}`);
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'GitHub Repository',
          click: () => {
            shell.openExternal('https://github.com/hazavi/aniways');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/hazavi/aniways/issues');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // Get primary display dimensions for maximized window
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Icon path differs between dev and production
  const iconPath = isDev 
    ? path.join(__dirname, "../public/Icon.ico")
    : path.join(process.resourcesPath, "public", "Icon.ico");

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      // Performance optimizations
      backgroundThrottling: false,
      enableWebSQL: false,
    },
    titleBarStyle: "default",
    autoHideMenuBar: false, // Show menu bar for fullscreen access
    show: false,
    backgroundColor: "#09090b", // Dark background to prevent white flash
  });

  // Set up keyboard shortcut for fullscreen (F11)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  // Maximize window on start
  mainWindow.maximize();

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http") && !url.includes("localhost")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  const startUrl = `http://localhost:${PORT}`;

  // Wait for Next.js server to be ready before loading
  const waitForServer = (retries = 0) => {
    const maxRetries = 60; // 30 seconds max
    
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      console.log("Next.js server is ready!");
      mainWindow.loadURL(startUrl);
    });
    
    req.on("error", () => {
      if (retries < maxRetries) {
        setTimeout(() => waitForServer(retries + 1), 500);
      } else {
        console.error("Timeout waiting for Next.js server");
        mainWindow.loadURL(startUrl); // Try anyway
      }
    });
    
    req.end();
  };

  waitForServer();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startNextServer() {
  // In development mode, Next.js is started by concurrently, so skip this
  if (isDev) {
    console.log("Development mode: Next.js dev server should be running via npm run dev");
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // In production, standalone is in resources folder (extraResource)
    const resourcesPath = process.resourcesPath;
    const serverPath = path.join(resourcesPath, "standalone", "server.js");
    const standaloneCwd = path.join(resourcesPath, "standalone");
    
    // In packaged Electron app, we need to use the bundled Node.js
    // Electron comes with Node.js, we can use require to run the server
    const fs = require("fs");
    
    console.log(`Starting Next.js server from: ${serverPath}`);
    console.log(`Working directory: ${standaloneCwd}`);
    
    // Check if server file exists
    if (!fs.existsSync(serverPath)) {
      console.error(`Server file not found: ${serverPath}`);
      console.log("Available in resources:", fs.readdirSync(resourcesPath));
      reject(new Error("Server file not found"));
      return;
    }

    // Set environment variables
    process.env.PORT = PORT.toString();
    process.env.HOSTNAME = "localhost";
    process.env.NODE_ENV = "production";
    
    // Change working directory
    const originalCwd = process.cwd();
    process.chdir(standaloneCwd);
    
    try {
      // Require and run the Next.js server
      require(serverPath);
      console.log("Next.js server started via require");
      
      // Wait for server to be ready
      const checkServer = (attempts = 0) => {
        const req = http.get(`http://localhost:${PORT}`, (res) => {
          console.log("Next.js server is responding!");
          resolve();
        });
        req.on("error", () => {
          if (attempts < 30) {
            setTimeout(() => checkServer(attempts + 1), 500);
          } else {
            console.log("Server check timed out, proceeding anyway");
            resolve();
          }
        });
        req.end();
      };
      
      setTimeout(() => checkServer(), 1000);
    } catch (error) {
      console.error("Error starting Next.js server:", error);
      process.chdir(originalCwd);
      reject(error);
    }
  });
}

function checkPortInUse(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(true); // Port is in use (server responding)
    });
    req.on("error", (err) => {
      if (err.code === "ECONNREFUSED") {
        resolve(false); // Port is free
      } else {
        resolve(true); // Assume in use for other errors
      }
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startBackendServer() {
  return new Promise(async (resolve) => {
    // First check if backend is already running
    const backendRunning = await checkPortInUse(BACKEND_PORT);
    if (backendRunning) {
      console.log(`Backend already running on port ${BACKEND_PORT}`);
      resolve();
      return;
    }

    const backendPath = path.join(__dirname, "../../backend");
    const isWindows = process.platform === "win32";

    console.log(`Starting backend server from: ${backendPath}`);

    // Check if virtual environment exists
    const venvPath = path.join(__dirname, "../../.venv");
    const venvPython = isWindows 
      ? path.join(venvPath, "Scripts", "python.exe")
      : path.join(venvPath, "bin", "python");

    // Use venv python if available, otherwise fallback to system python
    const fs = require("fs");
    let pythonCmd;
    
    if (fs.existsSync(venvPython)) {
      pythonCmd = venvPython;
      console.log(`Using virtual environment Python: ${pythonCmd}`);
    } else {
      pythonCmd = isWindows ? "python" : "python3";
      console.log(`Using system Python: ${pythonCmd}`);
    }

    const args = ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", BACKEND_PORT.toString()];
    
    console.log(`Running: ${pythonCmd} ${args.join(" ")}`);

    backendServer = spawn(pythonCmd, args, {
      cwd: backendPath,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
      },
      shell: isWindows,
      stdio: ["pipe", "pipe", "pipe"],
    });

    backendServer.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`Backend: ${output}`);
      if (output.includes("Uvicorn running") || output.includes("Application startup complete")) {
        resolve();
      }
    });

    backendServer.stderr.on("data", (data) => {
      const output = data.toString();
      console.log(`Backend: ${output}`);
      if (output.includes("Uvicorn running") || output.includes("Application startup complete")) {
        resolve();
      }
    });

    backendServer.on("error", (error) => {
      console.error("Failed to start backend server:", error);
      resolve(); // Don't block - user can start backend manually
    });

    backendServer.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Backend server exited with code ${code}`);
      }
    });

    // Resolve after timeout (backend might already be running)
    setTimeout(() => {
      // Check if backend is responding
      const req = http.get(`http://localhost:${BACKEND_PORT}/docs`, (res) => {
        console.log("Backend server is ready!");
        resolve();
      });
      req.on("error", () => {
        console.log("Backend not responding yet, continuing anyway...");
        resolve();
      });
      req.end();
    }, 3000);
  });
}

function cleanup() {
  console.log("Cleaning up...");
  
  if (nextServer && !nextServer.killed) {
    console.log("Stopping Next.js server...");
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", nextServer.pid, "/f", "/t"], { shell: true });
    } else {
      nextServer.kill("SIGTERM");
    }
    nextServer = null;
  }
  
  if (backendServer && !backendServer.killed) {
    console.log("Stopping backend server...");
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", backendServer.pid, "/f", "/t"], { shell: true });
    } else {
      backendServer.kill("SIGTERM");
    }
    backendServer = null;
  }
}

app.whenReady().then(async () => {
  console.log("App is ready, starting servers...");
  
  // Create menu first
  createMenu();
  
  try {
    // Start backend first, then Next.js
    await startBackendServer();
    await startNextServer();
    createWindow();
  } catch (error) {
    console.error("Error starting application:", error);
    createWindow(); // Try to create window anyway
  }
});

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  cleanup();
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  cleanup();
});
