
import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

interface PoseDetectionProps {
  exercise: string;
  onRepetitionCount: () => void;
  onFeedback: (message: string) => void;
}

const PoseDetection: React.FC<PoseDetectionProps> = ({ exercise, onRepetitionCount, onFeedback }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isWebcamLoading, setIsWebcamLoading] = useState(true);
  
  // Exercise state tracking
  const [isDown, setIsDown] = useState(false);
  const [repInProgress, setRepInProgress] = useState(false);
  const keypointsRef = useRef<any[]>([]);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const setupCamera = async () => {
      if (!videoRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
        
        videoRef.current.srcObject = stream;
        
        return new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });
      } catch (error) {
        console.error('Error accessing webcam:', error);
        onFeedback('Erro ao acessar câmera. Verifique suas permissões.');
      }
    };

    const loadModel = async () => {
      setIsModelLoading(true);
      try {
        // Use MoveNet - a lightweight and fast pose detection model
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        };
        
        // Initialize the detector
        detectorRef.current = await poseDetection.createDetector(model, detectorConfig);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading pose detection model:', error);
        onFeedback('Erro ao carregar o modelo de detecção. Tente novamente.');
      }
    };

    const initialize = async () => {
      await setupCamera();
      setIsWebcamLoading(false);
      await loadModel();
      
      if (videoRef.current && canvasRef.current && detectorRef.current) {
        startDetection();
      }
    };

    initialize();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      // Stop webcam
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const detectPose = async () => {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) return;
    
    try {
      // Detect poses
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      
      if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        keypointsRef.current = keypoints;
        
        // Process the detected pose based on the selected exercise
        processPoseForExercise(keypoints);
        
        // Draw the pose on the canvas
        drawPose(poses[0], canvasRef.current);
      }
      
      // Continue detection loop
      requestRef.current = requestAnimationFrame(detectPose);
    } catch (error) {
      console.error('Error during pose detection:', error);
    }
  };
  
  const startDetection = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(detectPose);
  };
  
  const drawPose = (pose: poseDetection.Pose, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !videoRef.current) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw keypoints
    const keypoints = pose.keypoints;
    
    // Draw connections (skeleton)
    ctx.strokeStyle = '#4361EE';
    ctx.lineWidth = 4;
    
    // Define the connections in the skeleton
    const connections = [
      // Torso
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      // Arms
      ['left_shoulder', 'left_elbow'],
      ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_elbow', 'right_wrist'],
      // Legs
      ['left_hip', 'left_knee'],
      ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'],
      ['right_knee', 'right_ankle'],
    ];
    
    // Get keypoints as a dictionary for easier access
    const keypointDict: {[key: string]: poseDetection.Keypoint} = {};
    keypoints.forEach(keypoint => {
      keypointDict[keypoint.name as string] = keypoint;
    });
    
    // Draw the connections
    connections.forEach(([start, end]) => {
      const startKeypoint = keypointDict[start];
      const endKeypoint = keypointDict[end];
      
      if (startKeypoint && endKeypoint && startKeypoint.score && endKeypoint.score && 
          startKeypoint.score > 0.5 && endKeypoint.score > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startKeypoint.x, startKeypoint.y);
        ctx.lineTo(endKeypoint.x, endKeypoint.y);
        ctx.stroke();
      }
    });
    
    // Draw individual keypoints
    keypoints.forEach(keypoint => {
      if (keypoint.score && keypoint.score > 0.5) {
        ctx.fillStyle = '#F72585';
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };
  
  const processPoseForExercise = (keypoints: poseDetection.Keypoint[]) => {
    const keypointDict: {[key: string]: poseDetection.Keypoint} = {};
    keypoints.forEach(keypoint => {
      keypointDict[keypoint.name as string] = keypoint;
    });
    
    switch (exercise) {
      case 'Agachamento':
        analyzeSquat(keypointDict);
        break;
      case 'Flexão de Braço':
        analyzePushUp(keypointDict);
        break;
      case 'Rosca Bíceps':
        analyzeBicepsCurl(keypointDict);
        break;
      default:
        // No specific exercise selected
        break;
    }
  };
  
  const calculateAngle = (a: poseDetection.Keypoint, b: poseDetection.Keypoint, c: poseDetection.Keypoint) => {
    if (!a || !b || !c) return 0;
    
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - 
                    Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    
    return angle;
  };
  
  const analyzeSquat = (keypoints: {[key: string]: poseDetection.Keypoint}) => {
    const leftHip = keypoints['left_hip'];
    const leftKnee = keypoints['left_knee'];
    const leftAnkle = keypoints['left_ankle'];
    const rightHip = keypoints['right_hip'];
    const rightKnee = keypoints['right_knee'];
    const rightAnkle = keypoints['right_ankle'];
    
    if (leftHip?.score && leftKnee?.score && leftAnkle?.score && 
        leftHip.score > 0.5 && leftKnee.score > 0.5 && leftAnkle.score > 0.5) {
      
      const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      
      // Average of both knee angles for more stability
      const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
      
      // Check if person is in squat position (knees bent)
      if (kneeAngle < 110 && !isDown) {
        setIsDown(true);
        onFeedback('Posição baixa! Mantenha a coluna reta.');
        
        // Check if back is straight
        const shoulderMidpoint = {
          x: (keypoints['left_shoulder'].x + keypoints['right_shoulder'].x) / 2,
          y: (keypoints['left_shoulder'].y + keypoints['right_shoulder'].y) / 2
        };
        
        const hipMidpoint = {
          x: (keypoints['left_hip'].x + keypoints['right_hip'].x) / 2,
          y: (keypoints['left_hip'].y + keypoints['right_hip'].y) / 2
        };
        
        const kneesMidpoint = {
          x: (keypoints['left_knee'].x + keypoints['right_knee'].x) / 2,
          y: (keypoints['left_knee'].y + keypoints['right_knee'].y) / 2
        };
        
        // Check if these three points are roughly aligned
        const backAlignment = Math.abs((shoulderMidpoint.x - hipMidpoint.x) / (hipMidpoint.x - kneesMidpoint.x));
        
        if (backAlignment > 1.3) {
          onFeedback('Corrija sua postura! Mantenha as costas retas.');
        }
      }
      
      // Check if person is back in standing position
      else if (kneeAngle > 160 && isDown) {
        setIsDown(false);
        setRepInProgress(true);
        onFeedback('Boa! Continue assim.');
        onRepetitionCount();
      }
    }
  };
  
  const analyzePushUp = (keypoints: {[key: string]: poseDetection.Keypoint}) => {
    const leftShoulder = keypoints['left_shoulder'];
    const leftElbow = keypoints['left_elbow'];
    const leftWrist = keypoints['left_wrist'];
    const rightShoulder = keypoints['right_shoulder'];
    const rightElbow = keypoints['right_elbow'];
    const rightWrist = keypoints['right_wrist'];
    
    if (leftShoulder?.score && leftElbow?.score && leftWrist?.score &&
        leftShoulder.score > 0.5 && leftElbow.score > 0.5 && leftWrist.score > 0.5) {
      
      const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      
      // Average of both elbow angles for better detection
      const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
      
      // Check if arms are bent (push-up down position)
      if (elbowAngle < 110 && !isDown) {
        setIsDown(true);
        onFeedback('Posição baixa! Mantenha o corpo alinhado.');
        
        // Check body alignment
        const nose = keypoints['nose'];
        const midHip = {
          x: (keypoints['left_hip'].x + keypoints['right_hip'].x) / 2,
          y: (keypoints['left_hip'].y + keypoints['right_hip'].y) / 2
        };
        
        const bodySlope = Math.abs((nose.y - midHip.y) / (nose.x - midHip.x));
        
        if (bodySlope > 0.3) {
          onFeedback('Cuidado! Seu corpo não está alinhado.');
        }
      } 
      // Check if arms are straight (push-up up position)
      else if (elbowAngle > 160 && isDown) {
        setIsDown(false);
        setRepInProgress(true);
        onFeedback('Excelente flexão! Continue.');
        onRepetitionCount();
      }
    }
  };
  
  const analyzeBicepsCurl = (keypoints: {[key: string]: poseDetection.Keypoint}) => {
    const leftShoulder = keypoints['left_shoulder'];
    const leftElbow = keypoints['left_elbow'];
    const leftWrist = keypoints['left_wrist'];
    
    if (leftShoulder?.score && leftElbow?.score && leftWrist?.score &&
        leftShoulder.score > 0.5 && leftElbow.score > 0.5 && leftWrist.score > 0.5) {
      
      const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      
      // Check if arm is bent (curl up position)
      if (elbowAngle < 80 && !isDown) {
        setIsDown(true);
        onFeedback('Posição alta correta. Segure brevemente.');
        
        // Check if elbow is stable (not moving forward)
        const previousFrames = keypointsRef.current;
        if (previousFrames && previousFrames.length > 0) {
          const previousElbow = previousFrames.find((kp: any) => kp.name === 'left_elbow');
          if (previousElbow && Math.abs(previousElbow.x - leftElbow.x) > 15) {
            onFeedback('Mantenha o cotovelo estável, não mova para frente.');
          }
        }
      } 
      // Check if arm is straight (curl down position)
      else if (elbowAngle > 150 && isDown) {
        setIsDown(false);
        setRepInProgress(true);
        onFeedback('Correto! Braço estendido.');
        onRepetitionCount();
      }
    }
  };

  return (
    <div className="relative">
      {/* Hidden video for pose detection */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
        width="640"
        height="480"
        onLoadedData={() => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        }}
      />
      
      {/* Canvas for drawing pose */}
      <canvas 
        ref={canvasRef}
        className="w-full h-full object-cover"
      />
      
      {/* Loading overlays */}
      {(isModelLoading || isWebcamLoading) && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p>{isWebcamLoading ? "Acessando câmera..." : "Carregando modelo de IA..."}</p>
        </div>
      )}
    </div>
  );
};

export default PoseDetection;
