// Type definitions for Electron API exposed via preload
interface ElectronAPI {
  platform: NodeJS.Platform;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getVersion: () => Promise<string>;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
