import { useEffect } from 'react';
import { create } from 'zustand';

export const GITHUB_OWNER = 'abhinavbharti2345';
export const GITHUB_REPO = 'PaceWise';
export const CURRENT_VERSION = '1.0.0';

export const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
export const DEFAULT_FALLBACK_APK_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest/download/PaceWise.apk`;

const STORAGE_KEY_LAST_CHECK = 'pacewise_last_update_check';
const STORAGE_KEY_DISMISSED_TAG = 'pacewise_dismissed_update_tag';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  tagName: string;
  releaseNotes: string;
  downloadUrl: string;
  publishedAt?: string;
  isMandatory: boolean;
}

/**
 * Compare two semver strings (e.g. "1.0.1" vs "1.0.0").
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemVer(v1: string, v2: string): number {
  const clean1 = (v1 || '').trim().replace(/^[vV]/, '');
  const clean2 = (v2 || '').trim().replace(/^[vV]/, '');

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const length = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < length; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

interface UpdateStoreState extends UpdateInfo {
  isChecking: boolean;
  isModalOpen: boolean;
  checkStatus: 'idle' | 'up-to-date' | 'update-available' | 'error';
  statusMessage: string | null;

  checkForUpdate: (force?: boolean) => Promise<void>;
  dismissModal: () => void;
  openModal: () => void;
}

export const useUpdateStore = create<UpdateStoreState>((set, get) => ({
  hasUpdate: false,
  currentVersion: CURRENT_VERSION,
  latestVersion: CURRENT_VERSION,
  tagName: `v${CURRENT_VERSION}`,
  releaseNotes: '',
  downloadUrl: DEFAULT_FALLBACK_APK_URL,
  isMandatory: false,
  isChecking: false,
  isModalOpen: false,
  checkStatus: 'idle',
  statusMessage: null,

  checkForUpdate: async (force = false) => {
    if (get().isChecking) return;

    // Rate-limit check: Throttle automatic background checks to once per 24 hours
    if (!force) {
      try {
        const lastCheck = localStorage.getItem(STORAGE_KEY_LAST_CHECK);
        if (lastCheck) {
          const elapsed = Date.now() - parseInt(lastCheck, 10);
          if (elapsed < CHECK_INTERVAL_MS) {
            return;
          }
        }
      } catch {
        /* ignore localStorage issues */
      }
    }

    set({
      isChecking: true,
      ...(force ? { checkStatus: 'idle', statusMessage: null } : {}),
    });

    try {
      const response = await fetch(LATEST_RELEASE_API, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      // Record check timestamp
      try {
        localStorage.setItem(STORAGE_KEY_LAST_CHECK, Date.now().toString());
      } catch {
        /* ignore */
      }

      if (!response.ok) {
        if (response.status === 404) {
          set({
            isChecking: false,
            checkStatus: 'up-to-date',
            statusMessage: "You're on the latest version.",
          });
          return;
        }
        if (response.status === 403) {
          set({
            isChecking: false,
            checkStatus: 'error',
            statusMessage: 'Update check rate-limited by GitHub. Please try again later.',
          });
          return;
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const rawTag = (data.tag_name || '').trim();
      const latestVer = rawTag.replace(/^[vV]/, '');
      const body = data.body || '';

      const isNewer = compareSemVer(latestVer, CURRENT_VERSION) > 0;
      const isMandatory = /\[mandatory\]/i.test(body);

      // Locate direct APK asset
      const apkAsset = Array.isArray(data.assets)
        ? data.assets.find((asset: { name?: string; browser_download_url?: string }) =>
            asset.name?.toLowerCase().endsWith('.apk')
          )
        : null;

      const downloadUrl = apkAsset?.browser_download_url || data.html_url || DEFAULT_FALLBACK_APK_URL;

      const dismissedTag = localStorage.getItem(STORAGE_KEY_DISMISSED_TAG);
      const shouldOpenModal = isNewer && (force || isMandatory || dismissedTag !== rawTag);

      set({
        hasUpdate: isNewer,
        currentVersion: CURRENT_VERSION,
        latestVersion: latestVer || CURRENT_VERSION,
        tagName: rawTag || `v${CURRENT_VERSION}`,
        releaseNotes: body,
        downloadUrl,
        publishedAt: data.published_at,
        isMandatory,
        isChecking: false,
        checkStatus: isNewer ? 'update-available' : 'up-to-date',
        statusMessage: isNewer
          ? `Version ${latestVer} is available!`
          : "You're using the latest version of PaceWise.",
        isModalOpen: shouldOpenModal ? true : get().isModalOpen,
      });
    } catch (err) {
      console.warn('PaceWise update check failed/offline:', err);
      set({
        isChecking: false,
        checkStatus: force ? 'error' : get().checkStatus,
        statusMessage: force
          ? 'Unable to connect to GitHub releases. Please check your network.'
          : get().statusMessage,
      });
    }
  },

  dismissModal: () => {
    try {
      const currentTag = get().tagName;
      if (currentTag) {
        localStorage.setItem(STORAGE_KEY_DISMISSED_TAG, currentTag);
      }
    } catch {
      /* ignore */
    }
    set({ isModalOpen: false });
  },

  openModal: () => set({ isModalOpen: true }),
}));

/**
 * Hook to consume update state with optional auto-check on mount
 */
export function useAppUpdate(autoCheck = true) {
  const store = useUpdateStore();

  useEffect(() => {
    if (!autoCheck) return;
    const timer = setTimeout(() => {
      store.checkForUpdate(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [autoCheck]);

  return store;
}
