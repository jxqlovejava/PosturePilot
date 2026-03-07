import { useState, RefObject, useEffect, ReactNode } from 'react';
import { Settings, Activity, Camera, CameraOff, X, Globe, Timer, TimerOff, Sliders, Zap, Monitor, ShieldAlert, Clock, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  enableDistanceMonitoring: boolean;
  setEnableDistanceMonitoring: (v: boolean) => void;
  stream: MediaStream | null;
  error: string | null;
  showTimer: boolean;
  setShowTimer: (v: boolean) => void;
  showDebug: boolean;
  setShowDebug: (v: boolean) => void;
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
  debugInfo: any;
  timerState: 'work' | 'rest';
}

type TabType = 'posture' | 'pomodoro' | 'settings';

const SettingGroup = ({ title, icon: Icon, children }: { title: string, icon: any, children: ReactNode }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3 px-1">
      <div className="p-1.5 bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 rounded-lg">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
    </div>
    <div className="bg-white dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl overflow-hidden shadow-sm">
      {children}
    </div>
  </div>
);

const SettingItem = ({ icon: Icon, iconColor, title, subtitle, control, isLast }: { icon: any, iconColor: string, title: string, subtitle?: string, control: ReactNode, isLast?: boolean }) => (
  <div className={cn("flex items-center justify-between p-4", !isLast && "border-b border-zinc-100 dark:border-zinc-700/50")}>
    <div className="flex items-center gap-4">
      <div className={cn("p-2 rounded-xl text-white shadow-sm", iconColor)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</div>
        {subtitle && <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {control}
    </div>
  </div>
);

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
  enableDistanceMonitoring,
  setEnableDistanceMonitoring,
  stream,
  error,
  showTimer,
  setShowTimer,
  showDebug,
  setShowDebug,
  onClose,
  language,
  setLanguage,
  isFirstVisit,
  onDismissOnboarding,
  videoRef,
  canvasRef,
  currentAngle,
  currentState,
  isReady,
  debugInfo,
  timerState
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(isFirstVisit ? 'settings' : 'posture');
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
              onClick={() => setActiveTab('posture')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'posture' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {t.posture_tab}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('pomodoro')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pomodoro' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                {t.pomodoro_tab}
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
          animate={{ opacity: activeTab === 'posture' ? 1 : 0, y: activeTab === 'posture' ? 0 : 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "transition-all duration-200",
            activeTab === 'posture' ? "relative z-10" : "absolute inset-0 pointer-events-none opacity-0 invisible"
          )}
        >
          <div className="flex flex-col gap-6 items-center">
            <div className="w-full max-w-3xl">
              {/* Camera Preview Card */}
              <div className="relative bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/80 rounded-[2rem] overflow-hidden shadow-sm flex flex-col aspect-[4/3] min-h-[400px]">
                {/* Header overlay */}
                <div className="absolute top-0 left-0 right-0 z-30 p-6 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
                  <h2 className="text-lg font-medium text-white drop-shadow-md">{t.camera_feed}</h2>
                  <button 
                    onClick={toggleCamera}
                    className="flex items-center gap-3 cursor-pointer group p-2 -mr-2 rounded-xl hover:bg-white/10 transition-colors focus:outline-none backdrop-blur-sm"
                  >
                    {isCameraEnabled ? <Camera className="w-5 h-5 text-emerald-400" /> : <CameraOff className="w-5 h-5 text-zinc-400" />}
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isCameraEnabled ? 'bg-emerald-500' : 'bg-zinc-600'
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
                
                <div className="relative flex-1 flex items-center justify-center bg-zinc-950">
                  {isCameraEnabled ? (
                    <>
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-contain -scale-x-100 filter brightness-[1.05] contrast-[1.02] saturate-[1.15] sepia-[0.05]"
                        playsInline
                        muted
                        autoPlay
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-contain -scale-x-100 pointer-events-none"
                      />
                      {/* Vignette effect */}
                      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
                      
                      {error && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 text-center z-40">
                          <p className="text-red-400 text-sm">{t.camera_error}</p>
                        </div>
                      )}
                      {!error && showDebug && (
                        <>
                          {debugInfo && (
                            <div className="absolute top-20 left-6 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white/90 text-xs font-mono flex flex-col gap-1 z-20">
                              <div>Face W: {debugInfo.faceWidth} / {debugInfo.baselineFaceWidth}</div>
                              <div>Torso H: {debugInfo.torsoHeight} / {debugInfo.baselineTorsoHeight}</div>
                              <div>Head ∠: {debugInfo.headAngle}°</div>
                              <div>Body ∠: {debugInfo.bodyAngle}°</div>
                              <div>Smooth ∠: {debugInfo.smoothedAngle}°</div>
                            </div>
                          )}
                          <div className="absolute bottom-6 left-6 right-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex justify-between items-center text-white z-20 shadow-2xl">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Angle</span>
                              <span className="font-mono text-lg">{Math.abs(currentAngle).toFixed(1)}°</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Model</span>
                              <span className={cn(
                                "font-medium text-sm flex items-center gap-1.5",
                                isReady ? "text-emerald-400" : "text-amber-400"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", isReady ? "bg-emerald-400" : "bg-amber-400 animate-pulse")} />
                                {isReady ? 'Ready' : 'Loading...'}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">State</span>
                              <span className={cn(
                                "font-medium text-sm px-2.5 py-1 rounded-lg bg-white/10",
                                currentState === 'good' ? "text-emerald-400" : "text-red-400"
                              )}>
                                {currentState === 'good' ? t.state_good : 
                                 currentState === 'tilt_left' ? t.state_tilt_left : 
                                 currentState === 'tilt_right' ? t.state_tilt_right : 
                                 currentState === 'slouch' ? t.state_slouch : 
                                 currentState === 'lean_forward' ? t.state_lean_forward : 
                                 currentState === 'too_close' ? t.state_too_close :
                                 currentState === 'too_far' ? t.state_too_far :
                                 t.state_good}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-zinc-500">
                      <CameraOff className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-medium">{t.enable_camera}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Privacy Notice */}
            <div className="flex items-center justify-center gap-2.5 px-5 py-3 bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/50 rounded-2xl mx-auto max-w-fit mt-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                {t.privacy_notice}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: activeTab === 'pomodoro' ? 1 : 0, y: activeTab === 'pomodoro' ? 0 : 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "transition-all duration-200",
            activeTab === 'pomodoro' ? "relative z-10" : "absolute inset-0 pointer-events-none opacity-0 invisible"
          )}
        >
          <div className="flex justify-center">
            {/* Session Control Card */}
            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-sm flex flex-col relative overflow-hidden min-h-[500px]">
              {/* Background decoration */}
                <div className={cn(
                  "absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 opacity-20 dark:opacity-10",
                  timerState === 'work' ? "bg-indigo-500" : "bg-emerald-500"
                )} />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{t.session_control}</h2>
                  <button 
                    onClick={toggleTimer}
                    className="flex items-center gap-3 cursor-pointer group p-2 -mr-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors focus:outline-none"
                  >
                    {isActive ? <Timer className={cn("w-5 h-5", timerState === 'work' ? "text-indigo-500" : "text-emerald-500")} /> : <TimerOff className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />}
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isActive ? (timerState === 'work' ? 'bg-indigo-500' : 'bg-emerald-500') : 'bg-zinc-200 dark:bg-zinc-700'
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
                
                <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                  <div className="relative flex items-center justify-center w-72 h-72 mb-12">
                    {/* Circular Progress */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="48" 
                        fill="none" 
                        strokeWidth="1.5" 
                        className="stroke-zinc-100 dark:stroke-zinc-800" 
                      />
                      <circle 
                        cx="50" cy="50" r="48" 
                        fill="none" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                        strokeDasharray="301.59" 
                        strokeDashoffset={301.59 * (1 - timeLeft / (timerState === 'work' ? workDuration * 60 : restDuration * 60))} 
                        className={cn(
                          "transition-all duration-1000 ease-linear",
                          timerState === 'work' ? "stroke-indigo-500" : "stroke-emerald-500"
                        )} 
                      />
                    </svg>
                    
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-medium uppercase tracking-widest text-zinc-400 mb-3">
                        {timerState === 'work' ? (language === 'zh' ? '专注中' : 'Focus') : (language === 'zh' ? '休息中' : 'Rest')}
                      </span>
                      <div className="text-7xl font-mono font-light tracking-tighter text-zinc-900 dark:text-zinc-100">
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={resetTimer}
                    className="px-8 py-3 rounded-full text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {t.reset_timer}
                  </button>
                </div>
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
          <div className="bg-transparent max-w-2xl mx-auto">
            <div className="space-y-6">
              <SettingGroup title={language === 'zh' ? '常规' : 'General'} icon={Settings}>
                <SettingItem
                  icon={Globe}
                  iconColor="bg-blue-500"
                  title={t.language}
                  subtitle={language === 'zh' ? '切换应用显示语言' : 'Change application language'}
                  control={
                    <button
                      onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {language === 'zh' ? 'English' : '中文'}
                    </button>
                  }
                />
                <SettingItem
                  icon={Timer}
                  iconColor="bg-emerald-500"
                  title={t.show_timer}
                  subtitle={t.show_timer_desc}
                  control={
                    <button
                      onClick={() => setShowTimer(!showTimer)}
                      className={cn("w-11 h-6 rounded-full transition-colors relative focus:outline-none", showTimer ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700")}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform", showTimer ? "translate-x-6" : "translate-x-1")} />
                    </button>
                  }
                />
                <SettingItem
                  icon={Zap}
                  iconColor="bg-amber-500"
                  title={language === 'zh' ? '显示调试信息' : 'Show Debug Info'}
                  subtitle={language === 'zh' ? '在摄像头画面上显示姿势检测的各项数值' : 'Show posture detection metrics on the camera feed'}
                  isLast
                  control={
                    <button
                      onClick={() => setShowDebug(!showDebug)}
                      className={cn("w-11 h-6 rounded-full transition-colors relative focus:outline-none", showDebug ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700")}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform", showDebug ? "translate-x-6" : "translate-x-1")} />
                    </button>
                  }
                />
              </SettingGroup>

              <SettingGroup title={language === 'zh' ? '姿势检测' : 'Posture Detection'} icon={ShieldAlert}>
                <SettingItem
                  icon={Camera}
                  iconColor="bg-indigo-500"
                  title={language === 'zh' ? '启用摄像头' : 'Enable Camera'}
                  subtitle={language === 'zh' ? '允许应用访问摄像头以检测姿势' : 'Allow app to access camera for posture detection'}
                  control={
                    <button
                      onClick={toggleCamera}
                      className={cn("w-11 h-6 rounded-full transition-colors relative focus:outline-none", isCameraEnabled ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700")}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform", isCameraEnabled ? "translate-x-6" : "translate-x-1")} />
                    </button>
                  }
                />
                <SettingItem
                  icon={Monitor}
                  iconColor="bg-blue-500"
                  title={t.enable_distance_monitoring}
                  subtitle={t.enable_distance_monitoring_desc}
                  control={
                    <button
                      onClick={() => setEnableDistanceMonitoring(!enableDistanceMonitoring)}
                      className={cn("w-11 h-6 rounded-full transition-colors relative focus:outline-none", enableDistanceMonitoring ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700")}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform", enableDistanceMonitoring ? "translate-x-6" : "translate-x-1")} />
                    </button>
                  }
                />
                <SettingItem
                  icon={Sliders}
                  iconColor="bg-purple-500"
                  title={t.posture_sensitivity}
                  subtitle={t.tilt_desc}
                  isLast
                  control={
                    <div className="flex items-center gap-3 w-48">
                      <input
                        type="range"
                        min="2"
                        max="25"
                        step="1"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 w-6 text-right">{sensitivity}</span>
                    </div>
                  }
                />
              </SettingGroup>

              <SettingGroup title={language === 'zh' ? '番茄钟' : 'Pomodoro Timer'} icon={Clock}>
                <SettingItem
                  icon={Timer}
                  iconColor="bg-rose-500"
                  title={language === 'zh' ? '启用计时器' : 'Enable Timer'}
                  subtitle={language === 'zh' ? '开启工作与休息循环计时' : 'Start work and rest cycle timer'}
                  control={
                    <button
                      onClick={toggleTimer}
                      className={cn("w-11 h-6 rounded-full transition-colors relative focus:outline-none", isActive ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700")}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform", isActive ? "translate-x-6" : "translate-x-1")} />
                    </button>
                  }
                />
                <SettingItem
                  icon={Activity}
                  iconColor="bg-orange-500"
                  title={t.work_duration}
                  subtitle={language === 'zh' ? '设置单次工作时长' : 'Set duration for a single work session'}
                  control={
                    <div className="flex items-center gap-3 w-48">
                      <input
                        type="range"
                        min="15"
                        max="90"
                        step="5"
                        value={workDuration}
                        onChange={(e) => setWorkDuration(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 w-12 text-right">{workDuration} {t.minutes}</span>
                    </div>
                  }
                />
                <SettingItem
                  icon={TimerOff}
                  iconColor="bg-teal-500"
                  title={t.rest_duration}
                  subtitle={language === 'zh' ? '设置单次休息时长' : 'Set duration for a single rest session'}
                  isLast
                  control={
                    <div className="flex items-center gap-3 w-48">
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={restDuration}
                        onChange={(e) => setRestDuration(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                      />
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 w-12 text-right">{restDuration} {t.minutes}</span>
                    </div>
                  }
                />
              </SettingGroup>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
