/**
 * Utility to detect if the app is running in Electron
 */
export function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.electronAPI?.isElectron;
}

/**
 * Get the platform (win32, darwin, linux)
 */
export function getPlatform(): NodeJS.Platform | null {
  if (typeof window === "undefined") return null;
  return window.electronAPI?.platform ?? null;
}

/**
 * Window controls for Electron
 */
export const windowControls = {
  minimize: () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.minimize();
    }
  },
  maximize: () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.maximize();
    }
  },
  close: () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.close();
    }
  },
};

/**
 * Get app version
 */
export async function getAppVersion(): Promise<string | null> {
  if (typeof window === "undefined" || !window.electronAPI) return null;
  return window.electronAPI.getVersion();
}
