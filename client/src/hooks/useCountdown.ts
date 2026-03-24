import { useState, useEffect, useCallback, useRef } from 'react';

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isToday: boolean;
}

export function useCountdown(targetDate: Date | string): CountdownValues {
  const getValues = useCallback((): CountdownValues => {
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      // Check if today
      const today = new Date();
      const targetD = new Date(targetDate);
      const isToday =
        today.getFullYear() === targetD.getFullYear() &&
        today.getMonth() === targetD.getMonth() &&
        today.getDate() === targetD.getDate();

      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: !isToday, isToday };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isExpired: false,
      isToday: false,
    };
  }, [targetDate]);

  const [values, setValues] = useState<CountdownValues>(getValues);
  const prevRef = useRef(values);

  useEffect(() => {
    const interval = setInterval(() => {
      const newValues = getValues();
      if (
        newValues.days !== prevRef.current.days ||
        newValues.hours !== prevRef.current.hours ||
        newValues.minutes !== prevRef.current.minutes ||
        newValues.seconds !== prevRef.current.seconds
      ) {
        prevRef.current = newValues;
        setValues(newValues);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getValues]);

  return values;
}
