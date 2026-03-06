import { useState, RefObject, useEffect, useRef, useCallback } from 'react';
import { Settings, Activity, Camera, CameraOff, Play, Square, X, Globe, Timer, TimerOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from './DynamicIsland';
import { translations, Language } from '../i18n';

interface DashboardProps {
  isCameraEnabled: boolean;
  toggleCamera: () => void;
  isActive: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  timeLeft: number;
  workDuration: number;
  setWorkDuration: (v: number) => void;
  restDuration: number;
  setRestDuration: (v: number) => void;
  sensitivity: number;
  setSensitivity: (v: number) => void;
  stream: MediaStream | null;
  error: string | null;
  showTimer: boolean;
  setShowTimer: (v: boolean) => void;
  onClose: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isFirstVisit: boolean;
  onDismissOnboarding: () => void;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  currentAngle: number;
  currentState: string;
  isReady: boolean;
}

export function Dashboard({
  isCameraEnabled,
  toggleCamera,
  isActive,
  toggleTimer,
  resetTimer,
  timeLeft,
  workDuration,
  setWorkDuration,
  restDuration,
  setRestDuration,
  sensitivity,
  setSensitivity,
  stream,
  error,
  showTimer,
  setShowTimer,
  onClose,
  language,
  setLanguage,
  isFirstVisit,
  onDismissOnboarding,
  videoRef,
  canvasRef,
  currentAngle,
  currentState,
  isReady
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'monitor' | 'settings'>(isFirstVisit ? 'settings' : 'monitor');
  const t = translations[language];

  useEffect(() => {
    if (isFirstVisit && isCameraEnabled && isActive && activeTab !== 'settings') {
      setActiveTab('settings');
    }
  }, [isFirstVisit, isCameraEnabled, isActive, activeTab]);

  useEffect(() => {
    let playPromise: Promise<void> | undefined;
    
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError') {
            console.error('Play error:', e);
          }
        });
      }
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    return () => {
      // Clean up is handled by the component unmounting or stream changing
    };
  }, [videoRef, stream]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 pt-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{t.app_title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t.app_subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'monitor' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {t.monitor_tab}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t.settings_tab}
              </div>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isFirstVisit && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl relative"
        >
          <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100 mb-3">{t.onboarding_title}</h2>
          <p className="text-emerald-800 dark:text-emerald-200 whitespace-pre-line leading-relaxed mb-6">
            {!isCameraEnabled ? t.onboarding_step1 : (!isActive ? t.onboarding_step2 : t.onboarding_step3)}
          </p>
          {isCameraEnabled && isActive && (
            <button 
              onClick={onDismissOnboarding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t.got_it}
            </button>
          )}
        </motion.div>
      )}

      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: activeTab === 'monitor' ? 1 : 0, y: activeTab === 'monitor' ? 0 : 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "transition-all duration-200",
            activeTab === 'monitor' ? "relative z-10" : "absolute inset-0 pointer-events-none opacity-0 invisible"
          )}
        >
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Camera Preview Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm flex flex-col aspect-square">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.camera_feed}</h2>
                  <button 
                    onClick={toggleCamera}
                    className="flex items-center gap-3 cursor-pointer group p-2 -mr-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors focus:outline-none"
                  >
                    {isCameraEnabled ? <Camera className="w-5 h-5 text-emerald-500" /> : <CameraOff className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />}
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isCameraEnabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isCameraEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </button>
                </div>
                
                <div className="relative flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center">
                  {isCameraEnabled ? (
                    <>
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover -scale-x-100 filter brightness-[1.05] contrast-[1.02] saturate-[1.15] sepia-[0.05]"
                        playsInline
                        muted
                        autoPlay
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
                      />
                      {error && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 text-center">
                          <p className="text-red-400 text-sm">{t.camera_error}</p>
                        </div>
                      )}
                      {!error && (
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-3 flex justify-between items-center text-white">
                          <div className="flex flex-col">
                            <span className="text-xs opacity-70">Angle</span>
                            <span className="font-mono">{Math.abs(currentAngle).toFixed(1)}°</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs opacity-70">Model</span>
                            <span className={cn(
                              "font-medium text-xs",
                              isReady ? "text-emerald-400" : "text-amber-400"
                            )}>
                              {isReady ? 'Ready' : 'Loading...'}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs opacity-70">State</span>
                            <span className={cn(
                              "font-medium",
                              currentState === 'good' ? "text-emerald-400" : "text-red-400"
                            )}>
                              {currentState === 'good' ? t.state_good : 
                               currentState === 'tilt_left' ? t.state_tilt_left : 
                               currentState === 'tilt_right' ? t.state_tilt_right : 
                               currentState === 'slouch' ? t.state_slouch : t.state_lean_forward}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-zinc-500 dark:text-zinc-400">
                      <CameraOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t.enable_camera}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Control Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm flex flex-col aspect-square">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.session_control}</h2>
                  <button 
                    onClick={toggleTimer}
                    className="flex items-center gap-3 cursor-pointer group p-2 -mr-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors focus:outline-none"
                  >
                    {isActive ? <Timer className="w-5 h-5 text-indigo-500" /> : <TimerOff className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />}
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isActive ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center py-8">
                  <div className="text-7xl font-mono font-light tracking-tighter text-zinc-900 dark:text-zinc-100 mb-6">
                    {formatTime(timeLeft)}
                  </div>
                  <button
                    onClick={resetTimer}
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    {t.reset_timer}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Privacy Notice */}
            <div className="text-center px-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {t.privacy_notice}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: activeTab === 'settings' ? 1 : 0, y: activeTab === 'settings' ? 0 : 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "transition-all duration-200",
            activeTab === 'settings' ? "relative z-10" : "absolute inset-0 pointer-events-none opacity-0 invisible"
          )}
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-8 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-8">{t.settings_tab}</h2>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.language}</label>
                  <button
                    onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {language === 'zh' ? 'English' : '中文'}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.show_timer}</label>
                  <button
                    onClick={() => setShowTimer(!showTimer)}
                    className={cn("w-11 h-6 rounded-full transition-colors relative", showTimer ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform", showTimer ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
                <p className="text-xs text-zinc-500">{t.show_timer_desc}</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.posture_sensitivity}</label>
                  <span className="text-sm text-zinc-500">{sensitivity}{t.tilt_desc}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="1"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.work_duration}</label>
                  <span className="text-sm text-zinc-500">{workDuration} {t.minutes}</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="5"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.rest_duration}</label>
                  <span className="text-sm text-zinc-500">{restDuration} {t.minutes}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={restDuration}
                  onChange={(e) => setRestDuration(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
