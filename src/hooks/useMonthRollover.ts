import { useEffect } from 'react';
import { useStore, getBudgetDatesForDate } from '../store/useStore';
import { startOfDay } from 'date-fns';

export function useMonthRollover() {
  const { config, updateConfig, isHydrated } = useStore();

  useEffect(() => {
    // Wait until store is hydrated from Supabase to avoid overwriting with defaults prematurely
    if (!isHydrated || !config.endDate) return;

    const checkRollover = () => {
      const now = new Date();
      const todayStart = startOfDay(now).getTime();
      const endOfBudget = startOfDay(new Date(config.endDate)).getTime();

      if (todayStart > endOfBudget) {
        // We have passed the end date of the current budget period.
        // Automatically roll over to the new month.
        const newDates = getBudgetDatesForDate(now);
        updateConfig({
          startDate: newDates.start,
          endDate: newDates.end,
        });
        console.log('[PaceWise] Automatically rolled over to new budget period', newDates);
      }
    };

    // Check immediately on mount or when dependencies change
    checkRollover();

    // Set an interval to check periodically (e.g. every hour) just in case the app is left open indefinitely
    const intervalId = setInterval(checkRollover, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [config.endDate, isHydrated, updateConfig]);
}
