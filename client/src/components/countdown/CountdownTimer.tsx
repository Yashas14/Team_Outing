import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCountdown } from '../../hooks/useCountdown';
import confetti from 'canvas-confetti';

interface CountdownTimerProps {
  targetDate: Date | string;
}

function FlipCard({ value, label }: { value: number; label: string }) {
  const [flipping, setFlipping] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlipping(true);
      const timer = setTimeout(() => setFlipping(false), 600);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const display = String(value).padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      <div className="flip-card">
        <div className={`flip-card-inner ${flipping ? 'flipping' : ''}`}>
          <div className="relative w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 bg-gradient-to-b from-primary to-primary-600 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
            <div className="absolute inset-x-0 top-1/2 h-px bg-black/10" />
            <span className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              {display}
            </span>
          </div>
        </div>
      </div>
      <span className="text-xs sm:text-sm font-medium text-gray-500 mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired, isToday } = useCountdown(targetDate);

  useEffect(() => {
    if (isToday) {
      const duration = 5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF6B35', '#FFD166', '#06D6A0'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FF6B35', '#FFD166', '#06D6A0'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isToday]);

  if (isToday) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-8"
      >
        <div className="text-6xl mb-4">🎊</div>
        <h2 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          TODAY IS THE DAY!
        </h2>
        <p className="text-xl text-gray-500 mt-3">Let's make it unforgettable! 🎉</p>
      </motion.div>
    );
  }

  if (isExpired) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-8"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-dark">
          We're having a blast!
        </h2>
        <p className="text-gray-500 mt-2">Hope you had an amazing time! 🌴✨</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-center"
    >
      <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">
        Counting down to the fun
      </p>
      <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
        <FlipCard value={days} label="Days" />
        <span className="text-2xl sm:text-3xl font-bold text-primary/50 -mt-6">:</span>
        <FlipCard value={hours} label="Hours" />
        <span className="text-2xl sm:text-3xl font-bold text-primary/50 -mt-6">:</span>
        <FlipCard value={minutes} label="Mins" />
        <span className="text-2xl sm:text-3xl font-bold text-primary/50 -mt-6">:</span>
        <FlipCard value={seconds} label="Secs" />
      </div>
    </motion.div>
  );
}
