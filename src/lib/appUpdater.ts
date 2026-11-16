import { registerPlugin } from '@capacitor/core';

export interface DownloadProgress {
  received: number;
  total: number;
  percent: number;
}

export interface AppUpdaterPlugin {
  canInstall(): Promise<{ canInstall: boolean }>;
  requestInstallPermission(): Promise<void>;
  downloadAndInstall(options: { url: string }): Promise<{ success: boolean }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (progress: DownloadProgress) => void
  ): Promise<{ remove: () => void }>;
}

export const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');
