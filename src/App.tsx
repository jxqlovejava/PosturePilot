import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DynamicIsland, IslandState } from './components/DynamicIsland';
import { Dashboard } from './components/Dashboard';
import { usePomodoro, TimerState } from './hooks/usePomodoro';
import { usePostureDetection, PostureState } from './hooks/usePostureDetection';
import { Language, translations } from './i18n';

export default function App() {
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [workDuration, setWorkDuration] = useState(45);
  const [restDuration, setRestDuration] = useState(5);
  const [sensitivity, setSensitivity] = useState(6);
  const [postureState, setPostureState] = useState<PostureState>('good');
  const [showTimer, setShowTimer] = useState(true);
  
  // Initialize language from localStorage or default to 'zh'
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('posturepilot_lang');
    return (saved === 'zh' || saved === 'en') ? saved : 'zh';
  });

  // Initialize first visit from localStorage
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    return !localStorage.getItem('posturepilot_visited');
  });

  const [isDashboardOpen, setIsDashboardOpen] = useState(isFirstVisit);
  const [justCorrected, setJustCorrected] = useState(false);
  const [cameraJustTurnedOn, setCameraJustTurnedOn] = useState(false);
  const prevPostureRef = useRef<PostureState>('good');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    localStorage.setItem('posturepilot_lang', language);
  }, [language]);

  const handleDismissOnboarding = () => {
    setIsFirstVisit(false);
    localStorage.setItem('posturepilot_visited', 'true');
  };

  useEffect(() => {
    if (isCameraEnabled) {
      setCameraJustTurnedOn(true);
      const timer = setTimeout(() => setCameraJustTurnedOn(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setCameraJustTurnedOn(false);
    }
  }, [isCameraEnabled]);

  useEffect(() => {
    if (prevPostureRef.current !== 'good' && postureState === 'good') {
      setJustCorrected(true);
      const timer = setTimeout(() => setJustCorrected(false), 2000);
      return () => clearTimeout(timer);
    }
    if (postureState !== 'good') {
      setCameraJustTurnedOn(false);
    }
    prevPostureRef.current = postureState;
  }, [postureState]);

  const handleStateChange = useCallback((state: TimerState) => {
    if (state === 'rest') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Time to rest!', { body: 'Take a break and stretch your neck.' });
      }
    }
  }, []);

  const { state: timerState, timeLeft, isActive, toggleTimer, resetTimer } = usePomodoro({
    workDurationMinutes: workDuration,
    restDurationMinutes: restDuration,
    onStateChange: handleStateChange
  });

  const handlePostureChange = useCallback((state: PostureState) => {
    setPostureState(state);
  }, []);

  const { stream, error, currentAngle, currentState, isReady } = usePostureDetection({
    enabled: isCameraEnabled,
    sensitivity,
    onPostureChange: handlePostureChange,
    videoRef,
    canvasRef
  });

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Determine Island State
  let islandState: IslandState = 'hidden';
  if (timerState === 'rest') {
    islandState = 'rest';
  } else if (isCameraEnabled && postureState === 'slouch') {
    islandState = 'warning_slouch';
  } else if (isCameraEnabled && postureState === 'lean_forward') {
    islandState = 'warning_lean_forward';
  } else if (isCameraEnabled && postureState === 'tilt_left') {
    islandState = 'warning_left';
  } else if (isCameraEnabled && postureState === 'tilt_right') {
    islandState = 'warning_right';
  } else if (isCameraEnabled && (justCorrected || (cameraJustTurnedOn && postureState === 'good'))) {
    islandState = 'good';
  } else if (isActive && (showTimer || timeLeft <= 10)) {
    islandState = 'idle';
  } else {
    islandState = 'hidden';
  }

  return (
    <div className={`min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-500/30 ${!isDashboardOpen ? 'h-screen overflow-hidden' : ''}`}>
      <DynamicIsland 
        state={islandState} 
        timeLeft={timeLeft} 
        isActive={isActive}
        isCameraEnabled={isCameraEnabled}
        onToggleDashboard={() => setIsDashboardOpen(prev => !prev)}
        onRestClick={() => {
          // Could open a modal with exercises
          alert(translations[language].exercises);
        }}
        language={language}
      />
      
      <motion.main 
        initial={false}
        animate={{ 
          opacity: isDashboardOpen ? 1 : 0, 
          y: isDashboardOpen ? 0 : 20, 
          scale: isDashboardOpen ? 1 : 0.95,
        }}
        className={`z-10 w-full transition-all duration-300 ${isDashboardOpen ? 'relative' : 'absolute inset-0 pointer-events-none'}`}
      >
        <Dashboard
          isCameraEnabled={isCameraEnabled}
          toggleCamera={() => setIsCameraEnabled(!isCameraEnabled)}
          isActive={isActive}
          toggleTimer={toggleTimer}
          resetTimer={resetTimer}
          timeLeft={timeLeft}
          workDuration={workDuration}
          setWorkDuration={setWorkDuration}
          restDuration={restDuration}
          setRestDuration={setRestDuration}
          sensitivity={sensitivity}
          setSensitivity={setSensitivity}
          stream={stream}
          error={error}
          showTimer={showTimer}
          setShowTimer={setShowTimer}
          onClose={() => setIsDashboardOpen(false)}
          language={language}
          setLanguage={setLanguage}
          isFirstVisit={isFirstVisit}
          onDismissOnboarding={handleDismissOnboarding}
          videoRef={videoRef}
          canvasRef={canvasRef}
          currentAngle={currentAngle}
          currentState={currentState}
          isReady={isReady}
        />
      </motion.main>
    </div>
  );
}
