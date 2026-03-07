import { useEffect, useRef, useState, RefObject } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as poseDetection from '@tensorflow-models/pose-detection';

export type PostureState = 'good' | 'tilt_left' | 'tilt_right' | 'slouch' | 'too_close' | 'too_far' | 'lean_forward';

interface UsePostureDetectionProps {
  enabled: boolean;
  sensitivity: number; // Angle threshold in degrees
  enableDistanceMonitoring?: boolean;
  onPostureChange: (state: PostureState) => void;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef?: RefObject<HTMLCanvasElement>;
  showDebug?: boolean;
}

export function usePostureDetection({ enabled, sensitivity, enableDistanceMonitoring = false, onPostureChange, videoRef, canvasRef, showDebug = false }: UsePostureDetectionProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentState, setCurrentState] = useState<PostureState>('good');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number>(null);
  
  const lastStateRef = useRef<PostureState>('good');
  const pendingStateRef = useRef<PostureState>('good');
  const pendingStateStartTimeRef = useRef<number>(Date.now());
  const smoothedAngleRef = useRef<number>(0);
  const smoothedFaceWidthRef = useRef<number>(0);
  const smoothedTorsoHeightRef = useRef<number>(0);
  const hasDetectedRef = useRef<boolean>(false);
  
  const baselineFaceWidthRef = useRef<number>(0);
  const baselineTorsoHeightRef = useRef<number>(0);
  const baselineFramesCountRef = useRef<number>(0);

  // 1. Manage camera stream
  useEffect(() => {
    let active = true;
    hasDetectedRef.current = false; // Reset detection flag on toggle
    lastStateRef.current = 'good';
    pendingStateRef.current = 'good';
    smoothedAngleRef.current = 0;
    smoothedFaceWidthRef.current = 0;
    smoothedTorsoHeightRef.current = 0;
    baselineFaceWidthRef.current = 0;
    baselineTorsoHeightRef.current = 0;
    baselineFramesCountRef.current = 0;

    async function startStream() {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (!active) {
          newStream.getTracks().forEach(track => track.stop());
          return;
        }
        setStream(newStream);
        setError(null);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please ensure permissions are granted.');
      }
    }

    if (enabled) {
      startStream();
    } else {
      setStream(null);
    }

    return () => {
      active = false;
      setStream(prev => {
        if (prev) {
          prev.getTracks().forEach(track => track.stop());
        }
        return null;
      });
    };
  }, [enabled]);

  // 2. Load model
  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        
        // Try to set WebGL backend, fallback to CPU if it fails
        try {
          await tf.setBackend('webgl');
        } catch (e) {
          console.warn('WebGL backend failed, falling back to CPU', e);
          await tf.setBackend('cpu');
        }
        
        let modelUrl = 'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4';
        try {
          const cachedModelKey = 'indexeddb://movenet-lightning';
          const models = await tf.io.listModels();
          if (models[cachedModelKey]) {
            console.log('Using cached model from IndexedDB');
            modelUrl = cachedModelKey;
          } else {
            console.log('Downloading model and caching to IndexedDB');
            const model = await tf.loadGraphModel(modelUrl, { fromTFHub: true });
            await model.save(cachedModelKey);
            model.dispose();
            modelUrl = cachedModelKey;
          }
        } catch (e) {
          console.warn('Failed to cache model locally, falling back to network', e);
        }

        const detectorConfig = { 
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          modelUrl: modelUrl
        };
        detectorRef.current = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        setIsReady(true);
      } catch (err: any) {
        console.error('Error loading model:', err);
        setError(`Failed to load posture detection model: ${err.message || String(err)}`);
      }
    }
    if (enabled && !detectorRef.current) {
      loadModel();
    }
  }, [enabled]);

  // Reset baseline when stream changes or enabled becomes true
  useEffect(() => {
    if (enabled && stream) {
      hasDetectedRef.current = false;
      pendingStateRef.current = 'good';
      pendingStateStartTimeRef.current = 0;
      smoothedAngleRef.current = 0;
      smoothedFaceWidthRef.current = 0;
      smoothedTorsoHeightRef.current = 0;
      baselineFaceWidthRef.current = 0;
      baselineTorsoHeightRef.current = 0;
      baselineFramesCountRef.current = 0;
    }
  }, [enabled, stream]);

  // 3. Detection loop
  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !isReady || !video || !detectorRef.current || !stream) return;

    let isCancelled = false;

    async function detectPose() {
      if (isCancelled || !video || !detectorRef.current) return;
      
      // Ensure the video has enough data before processing to prevent WebGPU/WebGL errors
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        if (!isCancelled) requestRef.current = requestAnimationFrame(detectPose);
        return;
      }
      
      try {
        const poses = await detectorRef.current.estimatePoses(video);
        if (isCancelled) return;
        
        if (poses.length > 0) {
          const pose = poses[0];
          
          // Draw keypoints if canvas is provided and debug is enabled
          if (canvasRef?.current && video) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              canvasRef.current.width = video.videoWidth;
              canvasRef.current.height = video.videoHeight;
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              
              if (showDebug) {
                // Draw points
                pose.keypoints.forEach(keypoint => {
                  if (keypoint.score && keypoint.score > 0.3) {
                    ctx.beginPath();
                    ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.8)'; // Emerald 500
                    ctx.fill();
                  }
                });
                
                // Draw lines for eyes and shoulders
                const drawLine = (p1: any, p2: any) => {
                  if (p1 && p2 && p1.score > 0.3 && p2.score > 0.3) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                  }
                };
                
                const leftEye = pose.keypoints.find(k => k.name === 'left_eye');
                const rightEye = pose.keypoints.find(k => k.name === 'right_eye');
                const leftShoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
                const rightShoulder = pose.keypoints.find(k => k.name === 'right_shoulder');
                
                drawLine(leftEye, rightEye);
                drawLine(leftShoulder, rightShoulder);
              }
            }
          }

          const leftEye = pose.keypoints.find(k => k.name === 'left_eye');
          const rightEye = pose.keypoints.find(k => k.name === 'right_eye');
          const leftShoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
          const rightShoulder = pose.keypoints.find(k => k.name === 'right_shoulder');
          
          let headAngle = 0;
          let bodyAngle = 0;
          let hasHeadAngle = false;
          let hasBodyAngle = false;
          let faceWidth = 0;
          let torsoHeight = 0;
          let hasFaceWidth = false;
          let hasTorsoHeight = false;

          if (leftEye && rightEye && leftEye.score && rightEye.score && leftEye.score > 0.2 && rightEye.score > 0.2) {
            const dx = rightEye.x - leftEye.x;
            const dy = rightEye.y - leftEye.y;
            headAngle = Math.atan(dy / dx) * (180 / Math.PI);
            hasHeadAngle = true;
            faceWidth = Math.sqrt(dx * dx + dy * dy);
            hasFaceWidth = true;
          }

          if (leftShoulder && rightShoulder && leftShoulder.score && rightShoulder.score && 
              leftShoulder.score > 0.2 && rightShoulder.score > 0.2) {
            const dx = rightShoulder.x - leftShoulder.x;
            const dy = rightShoulder.y - leftShoulder.y;
            bodyAngle = Math.atan(dy / dx) * (180 / Math.PI);
            hasBodyAngle = true;
          }

          if (hasFaceWidth && hasBodyAngle) {
            const eyeMidY = (leftEye!.y + rightEye!.y) / 2;
            const shoulderMidY = (leftShoulder!.y + rightShoulder!.y) / 2;
            torsoHeight = shoulderMidY - eyeMidY;
            hasTorsoHeight = true;
          }

          // Smooth the face width and torso height
          if (hasFaceWidth) {
            if (smoothedFaceWidthRef.current === 0) {
              smoothedFaceWidthRef.current = faceWidth;
            } else {
              smoothedFaceWidthRef.current = smoothedFaceWidthRef.current * 0.85 + faceWidth * 0.15;
            }
            faceWidth = smoothedFaceWidthRef.current;
          }

          if (hasTorsoHeight) {
            if (smoothedTorsoHeightRef.current === 0) {
              smoothedTorsoHeightRef.current = torsoHeight;
            } else {
              smoothedTorsoHeightRef.current = smoothedTorsoHeightRef.current * 0.85 + torsoHeight * 0.15;
            }
            torsoHeight = smoothedTorsoHeightRef.current;
          }

          if (hasHeadAngle || hasBodyAngle) {
            let rawAngleDeg = 0;
            if (hasHeadAngle && hasBodyAngle) {
              // Use the angle with the larger absolute value to catch both head tilt and body lean
              rawAngleDeg = Math.abs(headAngle) > Math.abs(bodyAngle) ? headAngle : bodyAngle;
            } else if (hasHeadAngle) {
              rawAngleDeg = headAngle;
            } else {
              rawAngleDeg = bodyAngle;
            }
            
            // Smooth the angle to prevent jitter, but don't smooth the first frame
            if (!hasDetectedRef.current) {
              smoothedAngleRef.current = rawAngleDeg;
            } else {
              smoothedAngleRef.current = smoothedAngleRef.current * 0.85 + rawAngleDeg * 0.15;
            }
            let angleDeg = smoothedAngleRef.current;

            let currentState: PostureState = 'good';
            
            // Add hysteresis based on pending state to prevent rapid flipping
            const currentThreshold = pendingStateRef.current === 'good' ? sensitivity : sensitivity * 0.75;
            
            // Accumulate baseline during the first 30 valid frames
            if (baselineFramesCountRef.current < 30) {
              if (hasFaceWidth) {
                baselineFaceWidthRef.current = (baselineFaceWidthRef.current * baselineFramesCountRef.current + faceWidth) / (baselineFramesCountRef.current + 1);
              }
              if (hasTorsoHeight) {
                baselineTorsoHeightRef.current = (baselineTorsoHeightRef.current * baselineFramesCountRef.current + torsoHeight) / (baselineFramesCountRef.current + 1);
              }
              if (hasFaceWidth || hasTorsoHeight) {
                baselineFramesCountRef.current++;
              }
            }
            
            // Sensitivity maps from 3 (very sensitive) to 15 (less sensitive)
            // We map this to a percentage threshold: 15% to 35%
            const percentThreshold = 0.15 + ((sensitivity - 3) / 12) * 0.2;
            
            // Hysteresis: if already in a warning state, make it easier to stay in that state
            const currentThThreshold = pendingStateRef.current === 'slouch' ? percentThreshold * 0.75 : percentThreshold;
            const currentCloseThreshold = pendingStateRef.current === 'too_close' ? percentThreshold * 0.75 : percentThreshold;
            const currentFarThreshold = pendingStateRef.current === 'too_far' ? percentThreshold * 0.75 : percentThreshold;
            const currentLeanThreshold = pendingStateRef.current === 'lean_forward' ? percentThreshold * 0.75 : percentThreshold;

            // Check for slouching and distance first
            const isTooClose = enableDistanceMonitoring && baselineFramesCountRef.current >= 30 && hasFaceWidth && faceWidth > baselineFaceWidthRef.current * (1 + currentCloseThreshold);
            const isTooFar = enableDistanceMonitoring && baselineFramesCountRef.current >= 30 && hasFaceWidth && faceWidth < baselineFaceWidthRef.current * (1 - currentFarThreshold);
            const isSlouching = baselineFramesCountRef.current >= 30 && hasTorsoHeight && torsoHeight < baselineTorsoHeightRef.current * (1 - currentThThreshold);
            
            // Leaning forward: face gets closer to camera relative to torso
            const currentRatio = hasFaceWidth && hasTorsoHeight && torsoHeight > 0 ? faceWidth / torsoHeight : 0;
            const baselineRatio = baselineTorsoHeightRef.current > 0 ? baselineFaceWidthRef.current / baselineTorsoHeightRef.current : 0;
            const isLeaningForward = baselineFramesCountRef.current >= 30 && currentRatio > 0 && baselineRatio > 0 && currentRatio > baselineRatio * (1 + currentLeanThreshold);

            if (isLeaningForward) {
              currentState = 'lean_forward';
            } else if (isTooClose && isSlouching) {
              // If both are true, prefer the one we are already in to prevent rapid toggling
              if (pendingStateRef.current === 'slouch') {
                currentState = 'slouch';
              } else {
                currentState = 'too_close';
              }
            } else if (isTooFar && isSlouching) {
              if (pendingStateRef.current === 'slouch') {
                currentState = 'slouch';
              } else {
                currentState = 'too_far';
              }
            } else if (isTooClose) {
              currentState = 'too_close';
            } else if (isTooFar) {
              currentState = 'too_far';
            } else if (isSlouching) {
              currentState = 'slouch';
            } else if (angleDeg > currentThreshold) {
              // Only check for left/right tilt if not slouching or distance issues
              currentState = 'tilt_left';
            } else if (angleDeg < -currentThreshold) {
              currentState = 'tilt_right';
            }
            
            setCurrentAngle(angleDeg);
            setCurrentState(currentState);
            setDebugInfo({
              faceWidth: faceWidth.toFixed(2),
              baselineFaceWidth: baselineFaceWidthRef.current.toFixed(2),
              torsoHeight: torsoHeight.toFixed(2),
              baselineTorsoHeight: baselineTorsoHeightRef.current.toFixed(2),
              headAngle: hasHeadAngle ? headAngle.toFixed(2) : 'N/A',
              bodyAngle: hasBodyAngle ? bodyAngle.toFixed(2) : 'N/A',
              smoothedAngle: angleDeg.toFixed(2)
            });

            if (!hasDetectedRef.current) {
              // Immediate detection on first successful frame or after settings change
              hasDetectedRef.current = true;
              pendingStateRef.current = currentState;
              
              if (currentState !== lastStateRef.current) {
                lastStateRef.current = currentState;
                onPostureChange(currentState);
              }
            } else {
              if (currentState !== pendingStateRef.current) {
                pendingStateRef.current = currentState;
                pendingStateStartTimeRef.current = Date.now();
              }

              // Require 1.5 seconds to trigger a warning, but 0.5 seconds to return to good posture
              let debounceTime = 1500;
              if (currentState === 'good') {
                debounceTime = 500;
              } else if (lastStateRef.current !== 'good') {
                // Transitioning between different warning states
                if ((currentState === 'slouch' || currentState === 'lean_forward' || currentState === 'too_close' || currentState === 'too_far') && 
                    (lastStateRef.current === 'tilt_left' || lastStateRef.current === 'tilt_right')) {
                  debounceTime = 0; // Upgrade priority immediately
                } else {
                  debounceTime = 500; // Switch between other warnings quickly
                }
              }

              if (currentState !== lastStateRef.current) {
                if (Date.now() - pendingStateStartTimeRef.current > debounceTime) {
                  lastStateRef.current = currentState;
                  onPostureChange(currentState);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
      }

      if (!isCancelled) {
        requestRef.current = requestAnimationFrame(detectPose);
      }
    }

    detectPose();

    return () => {
      isCancelled = true;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled, isReady, sensitivity, enableDistanceMonitoring, onPostureChange, stream, showDebug]);

  return { stream, isReady, error, currentAngle, currentState, debugInfo };
}
