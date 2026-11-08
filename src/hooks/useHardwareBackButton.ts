import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { popModal, hasOpenModal } from '../lib/modalStack';

/**
 * Handles Android native hardware & gesture back button navigation.
 * Hierarchy:
 * 1. Close the topmost active modal if one is open.
 * 2. If on a sub-route (not '/'), navigate back in history.
 * 3. If on the root Dashboard ('/'), exit/minimize the app.
 */
export function useHardwareBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backListenerHandle: { remove: () => Promise<void> } | null = null;

    const setupListener = async () => {
      backListenerHandle = await App.addListener('backButton', () => {
        // 1. If any modal is open, close it
        if (hasOpenModal()) {
          const handled = popModal();
          if (handled) return;
        }

        // 2. If on a sub-route, navigate back
        if (location.pathname !== '/') {
          navigate(-1);
          return;
        }

        // 3. If on the root Dashboard, exit/minimize the app
        App.exitApp();
      });
    };

    setupListener();

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove();
      }
    };
  }, [location.pathname, navigate]);
}
