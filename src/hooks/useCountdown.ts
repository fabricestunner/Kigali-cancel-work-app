import { useState, useEffect } from 'react';

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculate(targetDate: Date): Countdown {
  const difference = targetDate.getTime() - Date.now();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export function useCountdown(targetDate: Date): Countdown {
  const [countdown, setCountdown] = useState<Countdown>(() => calculate(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculate(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return countdown;
}
