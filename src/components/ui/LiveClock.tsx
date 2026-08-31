import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // A 1-second interval in an isolated component is lightweight 
    // and ensures the clock updates precisely at the top of the minute/day
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <p className="text-[var(--color-gray-dark)] text-sm mt-0.5">
      {format(now, 'EEEE, d MMMM yyyy • h:mm a')}
    </p>
  );
}
