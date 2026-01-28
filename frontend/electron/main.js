const { app, BrowserWindow, shell } = require("electron");
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

function createWindow() {
  // Get primary display dimensions for maximized window
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "../public/icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      // Performance optimizations
      backgroundThrottling: false,
      enableWebSQL: false,
    },
    titleBarStyle: "default",
    autoHideMenuBar: true,
    show: false,
    backgroundColor: "#09090b", // Dark background to prevent white flash
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
    const serverPath = path.join(__dirname, "../.next/standalone/server.js");
    
    // Use process.execPath to get the full path to node executable
    const nodePath = process.execPath;

    console.log(`Starting Next.js server: ${nodePath} ${serverPath}`);

    nextServer = spawn(nodePath, [serverPath], {
      env: {
        ...process.env,
        PORT: PORT.toString(),
        HOSTNAME: "localhost",
      },
      cwd: path.join(__dirname, "../.next/standalone"),
      stdio: ["pipe", "pipe", "pipe"],
    });

    nextServer.stdout.on("data", (data) => {
      console.log(`Next.js: ${data}`);
      if (data.toString().includes("Ready") || data.toString().includes("started")) {
        resolve();
      }
    });

    nextServer.stderr.on("data", (data) => {
      console.error(`Next.js Error: ${data}`);
    });

    nextServer.on("error", (error) => {
      console.error("Failed to start Next.js server:", error);
      reject(error);
    });

    // Resolve after a timeout if no "Ready" message
    setTimeout(resolve, 5000);
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
