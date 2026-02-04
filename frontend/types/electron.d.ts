// Type definitions for Electron API exposed via preload
interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
}

interface ElectronAPI {
  platform: NodeJS.Platform;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  goBack: () => void;
  goForward: () => void;
  goHome: () => void;
  reload: () => void;
  forceReload: () => void;
  onNavigationState: (callback: (state: NavigationState) => void) => void;
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
  getVersion: () => Promise<string>;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
