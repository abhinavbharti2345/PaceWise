import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const RECEIPTS_DIR = 'receipts';

/**
 * Ensures the internal receipts folder exists on device storage.
 */
async function ensureReceiptsDir(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Filesystem.mkdir({
      path: RECEIPTS_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('exists')) {
      console.warn('Receipts directory initialization note:', message);
    }
  }
}

/**
 * Captures a receipt from device Camera or Photos gallery, compresses it (quality 75, width 1280),
 * and saves locally to app-internal storage (Directory.Data / receipts).
 * Returns the unique receipt ID (filename), or null if cancelled/failed.
 */
export async function captureReceipt(sourceOption: 'camera' | 'photos' = 'camera'): Promise<string | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      await ensureReceiptsDir();

      const source = sourceOption === 'photos' ? CameraSource.Photos : CameraSource.Camera;

      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source,
        quality: 75,
        width: 1280,
        allowEditing: false,
      });

      if (!photo.path && !photo.webPath) {
        return null;
      }

      const ext = photo.format === 'png' ? 'png' : 'jpeg';
      const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const destinationPath = `${RECEIPTS_DIR}/${receiptId}`;

      if (photo.path) {
        const file = await Filesystem.readFile({ path: photo.path });
        await Filesystem.writeFile({
          path: destinationPath,
          directory: Directory.Data,
          data: file.data,
        });
      } else if (photo.webPath) {
        const res = await fetch(photo.webPath);
        const blob = await res.blob();
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        await Filesystem.writeFile({
          path: destinationPath,
          directory: Directory.Data,
          data: base64Data,
        });
      }

      return receiptId;
    } else {
      // Browser / Web development fallback
      return new Promise<string | null>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (sourceOption === 'camera') {
          input.capture = 'environment';
        }
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpeg`;
            try {
              localStorage.setItem(`pacewise_receipt_${receiptId}`, base64);
            } catch (e) {
              console.warn('LocalStorage limit for web receipt preview:', e);
            }
            resolve(receiptId);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('cancelled') || message.includes('canceled') || message.includes('User cancelled')) {
      return null;
    }
    console.error('Failed to capture receipt:', err);
    return null;
  }
}

/**
 * Resolves a local receiptId into a displayable WebView URL or web base64 URI.
 */
export async function getReceiptUrl(receiptId: string): Promise<string> {
  if (!receiptId) return '';

  try {
    if (Capacitor.isNativePlatform()) {
      const uriResult = await Filesystem.getUri({
        directory: Directory.Data,
        path: `${RECEIPTS_DIR}/${receiptId}`,
      });
      return Capacitor.convertFileSrc(uriResult.uri);
    } else {
      const stored = localStorage.getItem(`pacewise_receipt_${receiptId}`);
      return stored || '';
    }
  } catch (err) {
    console.warn(`Could not resolve receipt URL for ${receiptId}:`, err);
    return '';
  }
}

/**
 * Deletes a receipt file from disk when transaction is removed.
 */
export async function deleteReceipt(receiptId: string): Promise<void> {
  if (!receiptId) return;

  try {
    if (Capacitor.isNativePlatform()) {
      await Filesystem.deleteFile({
        directory: Directory.Data,
        path: `${RECEIPTS_DIR}/${receiptId}`,
      });
    } else {
      localStorage.removeItem(`pacewise_receipt_${receiptId}`);
    }
  } catch (err) {
    console.warn(`Could not delete receipt ${receiptId}:`, err);
  }
}
