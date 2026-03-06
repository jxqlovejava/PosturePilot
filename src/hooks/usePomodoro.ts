import { useState, useEffect, useCallback } from 'react';

export type TimerState = 'work' | 'rest';

interface UsePomodoroProps {
  workDurationMinutes: number;
  restDurationMinutes: number;
  onStateChange: (state: TimerState) => void;
}

export function usePomodoro({ workDurationMinutes, restDurationMinutes, onStateChange }: UsePomodoroProps) {
  const [state, setState] = useState<TimerState>('work');
  const [timeLeft, setTimeLeft] = useState(workDurationMinutes * 60);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setTimeLeft(state === 'work' ? workDurationMinutes * 60 : restDurationMinutes * 60);
  }, [workDurationMinutes, restDurationMinutes, state]);

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      const nextState = state === 'work' ? 'rest' : 'work';
      setState(nextState);
      onStateChange(nextState);
      setTimeLeft(nextState === 'work' ? workDurationMinutes * 60 : restDurationMinutes * 60);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, state, workDurationMinutes, restDurationMinutes, onStateChange]);

  const toggleTimer = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsActive(true);
    setState('work');
    setTimeLeft(workDurationMinutes * 60);
  }, [workDurationMinutes]);

  return { state, timeLeft, isActive, toggleTimer, resetTimer };
}
