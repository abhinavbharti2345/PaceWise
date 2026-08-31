import { useState, useEffect } from 'react';

export function useCurrentDate() {
  const [todayDateStr, setTodayDateStr] = useState(() => new Date().toISOString());

  useEffect(() => {
    let timeoutId: number;

    const scheduleNextUpdate = () => {
      const now = new Date();
      // Calculate next midnight in local time
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 1 // 1 second past midnight to be safe
      );
      
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();

      timeoutId = window.setTimeout(() => {
        setTodayDateStr(new Date().toISOString());
        scheduleNextUpdate();
      }, msUntilMidnight);
    };

    scheduleNextUpdate();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return todayDateStr;
}
