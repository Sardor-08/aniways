const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Platform info
  platform: process.platform,
  
  // Window controls
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  
  // Navigation controls
  goBack: () => ipcRenderer.send("nav-back"),
  goForward: () => ipcRenderer.send("nav-forward"),
  goHome: () => ipcRenderer.send("nav-home"),
  reload: () => ipcRenderer.send("nav-reload"),
  forceReload: () => ipcRenderer.send("nav-force-reload"),
  
  // Navigation state
  onNavigationState: (callback) => {
    ipcRenderer.on("navigation-state", (event, state) => callback(state));
  },
  
  // Maximize state
  onMaximizeChange: (callback) => {
    ipcRenderer.on("maximize-change", (event, isMaximized) => callback(isMaximized));
  },
  
  // App info
  getVersion: () => ipcRenderer.invoke("get-app-version"),
  
  // Check if running in Electron
  isElectron: true,
});
