import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { getExerciseConfig } from './pose-analysis/exercise-configs';
import { calculateAngle } from './pose-analysis/utils';
import { useToast } from "@/hooks/use-toast";

interface OptimizedPoseDetectionProps {
  exercise: string;
  onRepetitionCount: () => void;
  onFeedback: (message: string) => void;
  isActive?: boolean;
}

const OptimizedPoseDetection: React.FC<OptimizedPoseDetectionProps> = ({ 
  exercise, 
  onRepetitionCount, 
  onFeedback,
  isActive = true 
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number | null>(null);
  const keypointsRef = useRef<any[]>([]);
  const frameCountRef = useRef<number>(0);
  const lastFeedbackTimeRef = useRef<number>(0);
  const modelLoadedRef = useRef<boolean>(false);

  // States
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isWebcamLoading, setIsWebcamLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detectionQuality, setDetectionQuality] = useState<'poor' | 'good' | 'excellent'>('poor');
  const [isDown, setIsDown] = useState(false);
  const [exerciseDetected, setExerciseDetected] = useState(false);

  const { toast } = useToast();

  // Memoized exercise config
  const exerciseConfig = useMemo(() => 
    getExerciseConfig(exercise.toLowerCase().replace(/\s+/g, '')),
    [exercise]
  );

  // Memoized callbacks
  const handleFeedback = useCallback((message: string) => {
    const now = Date.now();
    if (now - lastFeedbackTimeRef.current < 1500) return;
    lastFeedbackTimeRef.current = now;
    onFeedback(message);
  }, [onFeedback]);

  const handleRepetitionCounted = useCallback(() => {
    onRepetitionCount();
  }, [onRepetitionCount]);

  // Initialize model
  const initializeModel = useCallback(async () => {
    if (modelLoadedRef.current) return;

    try {
      await tf.ready();
      const model = poseDetection.SupportedModels.MoveNet;
      const detector = await poseDetection.createDetector(model, {
        modelType: 'thunder',
        enableSmoothing: true,
      });
      
      detectorRef.current = detector;
      modelLoadedRef.current = true;
      setIsModelLoading(false);
    } catch (error) {
      console.error('Error loading model:', error);
      setLoadError('Erro ao carregar o modelo de detecção');
      handleFeedback('Erro ao carregar o modelo de detecção');
    }
  }, [handleFeedback]);

  // Setup camera
  const setupCamera = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      const constraints = {
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      
      await new Promise(resolve => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => resolve(null);
        }
      });

      setIsWebcamLoading(false);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setLoadError('Erro ao acessar a câmera');
      handleFeedback('Erro ao acessar a câmera');
    }
  }, [handleFeedback]);

  // Main detection loop
  const detectPose = useCallback(async () => {
    if (!isActive || !detectorRef.current || !videoRef.current || !canvasRef.current) {
      requestRef.current = requestAnimationFrame(detectPose);
      return;
    }

    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      
      if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        keypointsRef.current = keypoints;
        
        // Process pose and update UI
        processPoseForExercise(keypoints);
        drawPose(poses[0]);
      }

      frameCountRef.current++;
      requestRef.current = requestAnimationFrame(detectPose);
    } catch (error) {
      console.error('Error during pose detection:', error);
      requestRef.current = requestAnimationFrame(detectPose);
    }
  }, [isActive]);

  // Process pose for exercise
  const processPoseForExercise = useCallback((keypoints: poseDetection.Keypoint[]) => {
    if (!exerciseConfig) return;

    const keypointDict: {[key: string]: poseDetection.Keypoint} = {};
    keypoints.forEach(keypoint => {
      keypointDict[keypoint.name as string] = keypoint;
    });

    // Check visibility of required keypoints
    const requiredKeypoints = exerciseConfig.requiredKeypoints;
    let visibleKeypoints = 0;
    
    for (const point of requiredKeypoints) {
      const keypoint = keypointDict[point];
      if (keypoint?.score && keypoint.score > 0.2) {
        visibleKeypoints++;
      }
    }

    // Update detection quality
    const visibilityPercentage = (visibleKeypoints / requiredKeypoints.length) * 100;
    setDetectionQuality(
      visibilityPercentage < 50 ? 'poor' :
      visibilityPercentage < 80 ? 'good' : 'excellent'
    );

    // Exercise-specific analysis
    switch (exercise.toLowerCase().replace(/\s+/g, '')) {
      case 'squat':
        analyzeSquat(keypointDict);
        break;
      case 'pushup':
        analyzePushUp(keypointDict);
        break;
      case 'curl':
        analyzeBicepsCurl(keypointDict);
        break;
      case 'plank':
        analyzePlank(keypointDict);
        break;
      case 'lunge':
        analyzeLunge(keypointDict);
        break;
    }
  }, [exercise, exerciseConfig]);

  // Draw pose on canvas
  const drawPose = useCallback((pose: poseDetection.Pose) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !videoRef.current) return;

    // Set canvas dimensions
    if (canvasRef.current && 
        (canvasRef.current.width !== videoRef.current.videoWidth || 
         canvasRef.current.height !== videoRef.current.videoHeight)) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

    // Draw video frame
    ctx.drawImage(videoRef.current, 0, 0);

    // Draw keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = exerciseDetected ? '#ea384c' : '#0EA5E9';
        ctx.fill();
      }
    });
  }, [exerciseDetected]);

  // Exercise analysis functions
  const analyzeSquat = useCallback((keypoints: {[key: string]: poseDetection.Keypoint}) => {
    const leftHip = keypoints['left_hip'];
    const leftKnee = keypoints['left_knee'];
    const leftAnkle = keypoints['left_ankle'];

    if (leftHip?.score && leftKnee?.score && leftAnkle?.score &&
        leftHip.score > 0.2 && leftKnee.score > 0.2 && leftAnkle.score > 0.2) {
      
      const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      
      if (kneeAngle < 145 && !isDown) {
        setIsDown(true);
        setExerciseDetected(true);
        handleFeedback('Agachamento detectado! Mantenha a posição...');
      } 
      else if (kneeAngle > 160 && isDown) {
        setIsDown(false);
        setExerciseDetected(false);
        handleRepetitionCounted();
        handleFeedback('Boa! Repetição contabilizada.');
      }
    }
  }, [isDown, handleFeedback, handleRepetitionCounted]);

  // Similar implementations for other exercises...
  const analyzePushUp = useCallback((keypoints: {[key: string]: poseDetection.Keypoint}) => {
    // Implementation for push-up analysis
  }, [isDown, handleFeedback, handleRepetitionCounted]);

  const analyzeBicepsCurl = useCallback((keypoints: {[key: string]: poseDetection.Keypoint}) => {
    // Implementation for biceps curl analysis
  }, [isDown, handleFeedback, handleRepetitionCounted]);

  const analyzePlank = useCallback((keypoints: {[key: string]: poseDetection.Keypoint}) => {
    // Implementation for plank analysis
  }, [isDown, handleFeedback, handleRepetitionCounted]);

  const analyzeLunge = useCallback((keypoints: {[key: string]: poseDetection.Keypoint}) => {
    // Implementation for lunge analysis
  }, [isDown, handleFeedback, handleRepetitionCounted]);

  // Initialize
  useEffect(() => {
    initializeModel();
    setupCamera();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeModel, setupCamera]);

  // Start detection loop
  useEffect(() => {
    if (modelLoadedRef.current && !isWebcamLoading) {
      requestRef.current = requestAnimationFrame(detectPose);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [detectPose, isWebcamLoading]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="relative h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      
      <canvas 
        ref={canvasRef}
        className="w-full h-full object-cover rounded-lg"
      />
      
      {(isModelLoading || isWebcamLoading) && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p>{isWebcamLoading ? "Acessando câmera..." : "Carregando modelo de IA..."}</p>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center text-white p-4">
          <div className="bg-red-600 p-4 rounded-lg max-w-md">
            <p className="font-bold text-lg mb-2">Erro</p>
            <p>{loadError}</p>
            <button 
              className="mt-4 bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => {
                setLoadError(null);
                window.location.reload();
              }}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}
      
      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-bold 
                     ${detectionQuality === 'poor' ? 'bg-red-500' : 
                       detectionQuality === 'good' ? 'bg-yellow-500' : 'bg-green-500'}`}>
        {detectionQuality === 'poor' ? 'Detecção Ruim' : 
         detectionQuality === 'good' ? 'Detecção Boa' : 'Detecção Excelente'}
      </div>
    </div>
  );
};

export default OptimizedPoseDetection; 