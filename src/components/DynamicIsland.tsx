import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Coffee, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { translations, Language } from '../i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type IslandState = 'hidden' | 'idle' | 'warning_left' | 'warning_right' | 'warning_slouch' | 'warning_too_close' | 'warning_too_far' | 'warning_lean_forward' | 'rest' | 'good';

interface DynamicIslandProps {
  state: IslandState;
  timeLeft: number;
  isActive: boolean;
  isCameraEnabled: boolean;
  onRestClick: () => void;
  onToggleDashboard: () => void;
  language: Language;
}

export function DynamicIsland({ state, timeLeft, isActive, isCameraEnabled, onRestClick, onToggleDashboard, language }: DynamicIslandProps) {
  const t = translations[language];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getIslandContent = () => {
    switch (state) {
      case 'warning_left':
        return (
          <motion.div
            key="warning_left"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 px-4 py-2 text-red-400"
          >
            <span className="font-medium text-sm whitespace-nowrap">{t.warning_left}</span>
            <ArrowRight className="w-6 h-6 animate-bounce-x shrink-0" />
          </motion.div>
        );
      case 'warning_right':
        return (
          <motion.div
            key="warning_right"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 px-4 py-2 text-red-400"
          >
            <ArrowLeft className="w-6 h-6 animate-bounce-x shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">{t.warning_right}</span>
          </motion.div>
        );
      case 'warning_slouch':
        return (
          <motion.div
            key="warning_slouch"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 px-4 py-2 text-red-400"
          >
            <ArrowUp className="w-6 h-6 animate-bounce shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">{t.warning_slouch}</span>
          </motion.div>
        );
      case 'warning_lean_forward':
        return (
          <motion.div
            key="warning_lean_forward"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 px-4 py-2 text-red-400"
          >
            <ArrowDown className="w-6 h-6 animate-bounce shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">{t.warning_lean_forward}</span>
          </motion.div>
        );
      case 'warning_too_close':
        return (
          <motion.div
            key="warning_too_close"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 px-4 py-2 text-red-400"
          >
            <ArrowDown className="w-6 h-6 animate-bounce shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">{t.warning_too_close}</span>
          </motion.div>
        );
      case 'warning_too_far':
        return (
          <motion.div
            key="warning_too_far"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 px-4 py-2 text-red-400"
          >
            <ArrowUp className="w-6 h-6 animate-bounce shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">{t.warning_too_far}</span>
          </motion.div>
        );
      case 'rest':
        return (
          <motion.div
            key="rest"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 px-4 py-2 text-emerald-400 cursor-pointer hover:bg-white/5 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRestClick();
            }}
          >
            <Coffee className="w-5 h-5" />
            <div className="flex flex-col">
              <span className="font-medium text-sm">{t.rest_time}</span>
              <span className="text-xs opacity-70">{t.rest_desc}</span>
            </div>
          </motion.div>
        );
      case 'good':
        return (
          <motion.div
            key="good"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 text-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium text-xs">{t.perfect_posture}</span>
          </motion.div>
        );
      case 'hidden':
        return (
          <motion.div
            key="hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center w-full h-full"
          >
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors duration-500", 
              isCameraEnabled ? "bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-500",
              isActive && "animate-pulse"
            )} />
          </motion.div>
        );
      case 'idle':
      default:
        return (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 text-zinc-400"
          >
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors duration-500", 
              isCameraEnabled ? "bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-500",
              isActive && "animate-pulse"
            )} />
            <span className="font-mono text-xs tracking-wider">{formatTime(timeLeft)}</span>
          </motion.div>
        );
    }
  };

  const getIslandSize = () => {
    switch (state) {
      case 'warning_left':
      case 'warning_right':
      case 'warning_slouch':
      case 'warning_lean_forward':
      case 'warning_too_close':
      case 'warning_too_far':
        return { width: 320, height: 48, borderRadius: 24 };
      case 'rest':
        return { width: 220, height: 56, borderRadius: 28 };
      case 'good':
        return { width: 160, height: 36, borderRadius: 18 };
      case 'hidden':
        return { width: 48, height: 32, borderRadius: 16 };
      case 'idle':
      default:
        return { width: 100, height: 32, borderRadius: 16 };
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <motion.div
        layout
        onClick={onToggleDashboard}
        initial={false}
        animate={getIslandSize()}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-black transition-colors"
      >
        <AnimatePresence mode="wait">
          {getIslandContent()}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
