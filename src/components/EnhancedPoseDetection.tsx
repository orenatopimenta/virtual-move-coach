import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { useToast } from "@/hooks/use-toast";
import { analyzeSquat } from './pose-analysis/analyzeSquat';
import { analyzeLunge } from './pose-analysis/analyzeLunge';
import { analyzePushUp, checkPushupAlignment } from './pose-analysis/analyzePushUp';
import { analyzeBicepsCurl, isElbowStable } from './pose-analysis/analyzeBicepsCurl';
import { analyzePlank } from './pose-analysis/analyzePlank';
import { calculateAngle } from './pose-analysis/utils';
import { getExerciseConfig, checkExerciseVisibility } from './pose-analysis/exercise-configs';

interface RepIndicator {
  minAngle: number;
  maxAngle: number;
  executionTime: number;
  amplitude: number;
  upVelocity: number;
  downVelocity: number;
}

interface EnhancedPoseDetectionProps {
  exercise: string;
  onRepetitionCount: (quality: 'good' | 'average' | 'poor') => void;
  onFeedback: (message: string) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  onRepIndicatorExtracted: (indicator: RepIndicator) => void;
  stage: string;
}

const EnhancedPoseDetection: React.FC<EnhancedPoseDetectionProps> = ({ 
  exercise, 
  onRepetitionCount, 
  onFeedback,
  videoRef,
  onRepIndicatorExtracted,
  stage
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isWebcamLoading, setIsWebcamLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Exercise state tracking
  const [isDown, setIsDown] = useState(false);
  const [exerciseDetected, setExerciseDetected] = useState(false);
  const [detectionQuality, setDetectionQuality] = useState<'poor' | 'good' | 'excellent'>('poor');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [executionQuality, setExecutionQuality] = useState<'good' | 'average' | 'poor' | null>(null);
  
  // Get exercise configuration
  const exerciseConfig = getExerciseConfig(exercise);
  
  // Progress timeline
  const [timelineProgress, setTimelineProgress] = useState(0);
  
  // Refs for animation frames and tracking
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number | null>(null);
  const keypointsRef = useRef<any[]>([]);
  const prevKeypointsPosRef = useRef<any[]>([]);
  const frameCountRef = useRef<number>(0);
  const lastFeedbackTimeRef = useRef<number>(Date.now());
  const lastRepCountTimeRef = useRef<number>(Date.now());
  const goodDetectionFramesRef = useRef<number>(0);
  const debugInfoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // For 3D detection
  const depthEstimateRef = useRef<{[key: string]: number}>({});
  const movementHistoryRef = useRef<{[key: string]: number[]}>({});
  
  // Timer for exercise pacing
  useEffect(() => {
    // Update timeline progress
    const intervalId = setInterval(() => {
      setTimelineProgress(prev => {
        // Cycle from 0 to 100 every 5 seconds
        const newValue = (prev + 0.5) % 100;
        return newValue;
      });
    }, 25); // 40 fps update
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Example images/instructions for the exercise
  const exerciseExamples = {
    squat: [
      { image: "👤 ▲", instruction: "Mantenha os pés na largura dos ombros" },
      { image: "👤 ↓", instruction: "Dobre os joelhos como se fosse sentar" },
      { image: "👤 ◯", instruction: "Mantenha as costas retas e o peso nos calcanhares" },
      { image: "👤 ▲", instruction: "Retorne à posição inicial" }
    ],
    lunge: [
      { image: "👤 ▲", instruction: "Fique em pé com os pés juntos" },
      { image: "👤 ↔", instruction: "Dê um passo à frente com uma perna" },
      { image: "👤 ↓", instruction: "Dobre ambos os joelhos a 90 graus" },
      { image: "👤 ▲", instruction: "Empurre de volta para a posição inicial" }
    ],
    plank: [
      { image: "👤 ═", instruction: "Apoie-se nos antebraços e pontas dos pés" },
      { image: "👤 ▬", instruction: "Mantenha o corpo em linha reta" },
      { image: "👤 ↔", instruction: "Contraia o abdômen e mantenha a posição" },
      { image: "👤 ═", instruction: "Respire normalmente e sustente" }
    ],
    pushup: [
      { image: "👤 ▲", instruction: "Posição de prancha com braços estendidos" },
      { image: "👤 ↓", instruction: "Dobre os cotovelos, abaixando o corpo" },
      { image: "👤 ↑", instruction: "Estenda os braços, subindo o corpo" },
      { image: "👤 ▲", instruction: "Mantenha o corpo alinhado durante todo o movimento" }
    ],
    curl: [
      { image: "👤 ▼", instruction: "Fique em pé com os braços estendidos" },
      { image: "👤 ↑", instruction: "Dobre os cotovelos, elevando os antebraços" },
      { image: "👤 ⚔️", instruction: "Contraia os bíceps no topo do movimento" },
      { image: "👤 ▼", instruction: "Retorne à posição inicial lentamente" }
    ]
  };
  
  // Get examples for current exercise or use default
  const examples = exerciseExamples[exercise as keyof typeof exerciseExamples] || 
                  exerciseExamples.squat;
  
  useEffect(() => {
    // Cycle through examples
    const exampleInterval = setInterval(() => {
      setCurrentExampleIndex(prev => (prev + 1) % examples.length);
    }, 4000);
    
    return () => clearInterval(exampleInterval);
  }, [examples]);
  
  // Camera and model setup
  useEffect(() => {
    const setupCamera = async () => {
      if (!videoRef.current) return;

      try {
        console.log('Requesting camera access...');
        // Request camera with lower resolution for better performance
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 320 }, // Reduced for performance
            height: { ideal: 240 },
            frameRate: { ideal: 20 } // Lower framerate for stability
          },
          audio: false
        });
        
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.setAttribute('autoplay', '');
        
        return new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('Camera successfully configured');
              videoRef.current?.play().catch(e => {
                console.error('Error playing camera stream:', e);
                setLoadError('Error starting camera stream. Please refresh and try again.');
              });
              resolve();
            };
          }
        });
      } catch (error) {
        console.error('Error accessing camera:', error);
        setLoadError('Error accessing camera. Please check your camera permissions in browser settings.');
        onFeedback('Error accessing camera. Please check your permissions and refresh the page.');
      }
    };

    const loadModel = async () => {
      if (!isModelLoading) return;
      setIsModelLoading(true);
      
      try {
        console.log('Initializing TensorFlow.js backend...');
        // Import and initialize TensorFlow
        const tf = await import('@tensorflow/tfjs-core');
        await import('@tensorflow/tfjs-backend-webgl');
        
        // Optimize WebGL backend settings for mobile
        await tf.setBackend('webgl');
        
        // More basic settings that work across browsers
        tf.env().set('WEBGL_CPU_FORWARD', false);
        tf.env().set('WEBGL_PACK', true);
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
        tf.env().set('WEBGL_FLUSH_THRESHOLD', 1);
        
        await tf.ready();
        console.log('TensorFlow.js backend initialized:', tf.getBackend());
        
        console.log('Loading MoveNet model...');
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING, // Use smaller, faster model
          enableSmoothing: true // Enable pose smoothing
        };
        
        detectorRef.current = await poseDetection.createDetector(model, detectorConfig);
        console.log('MoveNet model loaded successfully');
        setIsModelLoading(false);
      } catch (error: any) {
        console.error('Error loading detection model:', error);
        setLoadError(`Error loading detection model: ${error?.message || error}`);
        onFeedback(`Error loading detection model: ${error?.message || error}`);
        setIsModelLoading(false);
      }
    };

    const initialize = async () => {
      try {
        // Setup camera first
        await setupCamera();
        setIsWebcamLoading(false);
        
        // Then load the model
        await loadModel();
        
        // Start detection if everything is ready
        if (videoRef.current && canvasRef.current && detectorRef.current) {
          console.log('Starting pose detection');
          startDetection();
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        setLoadError('An error occurred during initialization. Please refresh and try again.');
        onFeedback('An error occurred during initialization. Please refresh and try again.');
      }
    };

    // Start initialization
    initialize();

    // Cleanup function
    return () => {
      console.log('Cleaning up EnhancedPoseDetection...');
      
      // Stop detection loop
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      
      // Stop webcam
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Camera track stopped in cleanup:', track.label);
        });
        videoRef.current.srcObject = null;
      }
      
      // Clear any remaining timeouts
      if (debugInfoTimeoutRef.current) {
        clearTimeout(debugInfoTimeoutRef.current);
        debugInfoTimeoutRef.current = null;
      }
    };
  }, [onFeedback]);

  // Main pose detection function
  const detectPose = async () => {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) return;
    
    try {
      // Detect poses
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      
      if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        keypointsRef.current = keypoints;
        
        // Store previous positions for movement detection
        if (frameCountRef.current % 5 === 0) {
          prevKeypointsPosRef.current = [...keypoints];
        }
        
        // Estimate depth/Z-axis values
        estimateDepthFromMotion(keypoints);
        
        // Process the detected pose based on the selected exercise
        processPoseForExercise(keypoints);
        
        // Draw the pose on the canvas
        drawPose(poses[0], canvasRef.current);
      }
      
      // Increment frame counter
      frameCountRef.current++;
      
      // Continue detection loop
      requestRef.current = requestAnimationFrame(detectPose);
    } catch (error) {
      console.error('Erro durante a detecção de pose:', error);
      onFeedback('Erro na detecção. Tente reiniciar o exercício.');
      // Attempt to restart detection after a short delay
      setTimeout(() => {
        requestRef.current = requestAnimationFrame(detectPose);
      }, 2000);
    }
  };
  
  // Estimate Z-axis depth based on movement patterns and keypoint sizes
  const estimateDepthFromMotion = (keypoints: poseDetection.Keypoint[]) => {
    // Skip if we don't have enough previous data
    if (frameCountRef.current < 10) return;
    
    // Calculate relative sizes of body parts to estimate depth
    const keypointDict: {[key: string]: poseDetection.Keypoint} = {};
    keypoints.forEach(keypoint => {
      keypointDict[keypoint.name as string] = keypoint;
    });
    
    // Only update every few frames to reduce noise
    if (frameCountRef.current % 10 === 0) {
      try {
        // Shoulder width can be used to estimate distance from camera
        const leftShoulder = keypointDict['left_shoulder'];
        const rightShoulder = keypointDict['right_shoulder'];
        
        if (leftShoulder && rightShoulder && leftShoulder.score && rightShoulder.score &&
            leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
          
          // Calculate shoulder width in pixels
          const shoulderWidth = Math.sqrt(
            Math.pow(rightShoulder.x - leftShoulder.x, 2) + 
            Math.pow(rightShoulder.y - leftShoulder.y, 2)
          );
          
          // Track movement in Z direction
          const prevWidth = depthEstimateRef.current['shoulderWidth'] || shoulderWidth;
          const widthChange = shoulderWidth - prevWidth;
          
          // Store current width
          depthEstimateRef.current['shoulderWidth'] = shoulderWidth;
          
          // Store in movement history
          if (!movementHistoryRef.current['shoulder']) {
            movementHistoryRef.current['shoulder'] = [];
          }
          
          movementHistoryRef.current['shoulder'].push(widthChange);
          
          // Keep history to a reasonable size
          if (movementHistoryRef.current['shoulder'].length > 30) {
            movementHistoryRef.current['shoulder'].shift();
          }
        }
      } catch (error) {
        console.error("Error estimating depth:", error);
      }
    }
  };
  
  // Start the detection loop
  const startDetection = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(detectPose);
  };
  
  // Draw the detected pose on the canvas
  const drawPose = (pose: poseDetection.Pose, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !videoRef.current) return;
    
    // Set canvas dimensions if not already set
    if (canvas.width !== videoRef.current.videoWidth || 
        canvas.height !== videoRef.current.videoHeight) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    }
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the video frame
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Apply semi-transparent overlay based on execution quality
    if (executionQuality) {
      ctx.fillStyle = executionQuality === 'good' 
                      ? 'rgba(0, 255, 0, 0.2)' 
                      : executionQuality === 'average'
                        ? 'rgba(255, 255, 0, 0.2)'
                        : 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw timeline progress bar (Instagram style)
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, 4);
    ctx.fillStyle = '#1EAEDB';
    ctx.fillRect(0, 0, (canvas.width * timelineProgress) / 100, 4);
    
    // Draw exercise example
    // const currentExample = examples[currentExampleIndex];
    // if (currentExample) {
    //   ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    //   ctx.fillRect(10, 10, 300, 80);
    //   
    //   ctx.fillStyle = '#ffffff';
    //   ctx.font = "24px Arial";
    //   ctx.fillText(currentExample.image, 20, 40);
    //   
    //   ctx.font = "14px Arial";
    //   ctx.fillText(currentExample.instruction, 20, 70);
    // }
    
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
      
      // Lower threshold for visibility
      if (startKeypoint && endKeypoint && startKeypoint.score && endKeypoint.score && 
          startKeypoint.score > 0.2 && endKeypoint.score > 0.2) {
        
        // Exercise-specific highlighting
        const isLowerBody = start.includes('knee') || end.includes('knee') || 
                         start.includes('ankle') || end.includes('ankle') || 
                         start.includes('hip');
        
        const isUpperBody = start.includes('shoulder') || end.includes('shoulder') || 
                         start.includes('elbow') || end.includes('elbow') || 
                         start.includes('wrist');
                         
        // Highlight the relevant body parts based on the exercise
        if ((exercise === 'squat' || exercise === 'lunge') && isLowerBody && exerciseDetected) {
          ctx.strokeStyle = '#ea384c'; // Red for lower body exercises
          ctx.lineWidth = 6;
        } else if ((exercise === 'pushup' || exercise === 'plank') && 
                  (isUpperBody || (start.includes('hip') && end.includes('shoulder'))) && 
                  exerciseDetected) {
          ctx.strokeStyle = '#e07c00'; // Orange for push-up and plank
          ctx.lineWidth = 6;
        } else if (exercise === 'curl' && isUpperBody && exerciseDetected) {
          ctx.strokeStyle = '#8c00e0'; // Purple for biceps
          ctx.lineWidth = 6;
        } else if ((exercise === 'squat' || exercise === 'lunge') && isLowerBody) {
          ctx.strokeStyle = '#0EA5E9'; // Blue for lower body when not in position
          ctx.lineWidth = 5;
        } else if ((exercise === 'pushup' || exercise === 'plank' || exercise === 'curl') && isUpperBody) {
          ctx.strokeStyle = '#22c55e'; // Green for upper body when not in position
          ctx.lineWidth = 5;
        } else {
          ctx.strokeStyle = '#4361EE'; // Default blue
          ctx.lineWidth = 4;
        }
        
        ctx.beginPath();
        ctx.moveTo(startKeypoint.x, startKeypoint.y);
        ctx.lineTo(endKeypoint.x, endKeypoint.y);
        ctx.stroke();
      }
    });
    
    // Draw individual keypoints
    keypoints.forEach(keypoint => {
      // Lower threshold for important keypoints based on exercise
      let confidenceThreshold = 0.4;
      
      if (exercise === 'squat' || exercise === 'lunge') {
        // For squats and lunges, we care more about leg keypoints
        confidenceThreshold = keypoint.name?.includes('knee') || 
                           keypoint.name?.includes('ankle') || 
                           keypoint.name?.includes('hip') ? 0.2 : 0.4;
      } else if (exercise === 'pushup' || exercise === 'curl' || exercise === 'plank') {
        // For upper body exercises, we care more about arm and shoulder keypoints
        confidenceThreshold = keypoint.name?.includes('shoulder') || 
                           keypoint.name?.includes('elbow') || 
                           keypoint.name?.includes('wrist') ? 0.2 : 0.4;
      }
      
      if (keypoint.score && keypoint.score > confidenceThreshold) {
        const isImportantForExercise = 
          (exercise === 'squat' || exercise === 'lunge') && 
            (keypoint.name?.includes('knee') || keypoint.name?.includes('ankle') || keypoint.name?.includes('hip')) ||
          (exercise === 'pushup' || exercise === 'curl' || exercise === 'plank') && 
            (keypoint.name?.includes('shoulder') || keypoint.name?.includes('elbow') || keypoint.name?.includes('wrist'));
        
        if (isImportantForExercise) {
          if (exerciseDetected) {
            // Exercise-specific color when the movement is detected
            const color = 
              (exercise === 'squat' || exercise === 'lunge') ? '#ea384c' :
              (exercise === 'pushup' || exercise === 'plank') ? '#e07c00' : 
              '#8c00e0';
              
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 10, 0, 2 * Math.PI);
            ctx.fill();
            
            // White outline
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            // Color for important joints when not in exercise position
            const color = 
              (exercise === 'squat' || exercise === 'lunge') ? '#0EA5E9' :
              (exercise === 'pushup' || exercise === 'plank') ? '#22c55e' : 
              '#a855f7';
              
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 8, 0, 2 * Math.PI);
            ctx.fill();
          }
          
          // Add angle labels for exercise-specific joints
          if ((exercise === 'squat' || exercise === 'lunge') && keypoint.name?.includes('knee')) {
            const hip = keypointDict[keypoint.name.includes('left') ? 'left_hip' : 'right_hip'];
            const knee = keypoint;
            const ankle = keypointDict[keypoint.name.includes('left') ? 'left_ankle' : 'right_ankle'];
            
            if (hip && knee && ankle && hip.score && knee.score && ankle.score && 
                hip.score > 0.2 && knee.score > 0.2 && ankle.score > 0.2) {
              const kneeAngle = calculateAngle(hip, knee, ankle);
              
              // Display the angle with better visibility
              ctx.fillStyle = "#FFFFFF";
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 3;
              ctx.font = "bold 16px Arial";
              
              ctx.strokeText(`${Math.round(kneeAngle)}°`, knee.x + 15, knee.y);
              ctx.fillText(`${Math.round(kneeAngle)}°`, knee.x + 15, knee.y);
            }
          } else if ((exercise === 'pushup' || exercise === 'curl') && keypoint.name?.includes('elbow')) {
            const shoulder = keypointDict[keypoint.name.includes('left') ? 'left_shoulder' : 'right_shoulder'];
            const elbow = keypoint;
            const wrist = keypointDict[keypoint.name.includes('left') ? 'left_wrist' : 'right_wrist'];
            
            if (shoulder && elbow && wrist && shoulder.score && elbow.score && wrist.score && 
                shoulder.score > 0.2 && elbow.score > 0.2 && wrist.score > 0.2) {
              const elbowAngle = calculateAngle(shoulder, elbow, wrist);
              
              ctx.fillStyle = "#FFFFFF";
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 3;
              ctx.font = "bold 16px Arial";
              
              ctx.strokeText(`${Math.round(elbowAngle)}°`, elbow.x + 15, elbow.y);
              ctx.fillText(`${Math.round(elbowAngle)}°`, elbow.x + 15, elbow.y);
            }
          }
        } else {
          // Outras partes do corpo
          ctx.fillStyle = '#F72585';
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });
    
    // Display detection quality indicator
    // const qualityColors = {
    //   poor: '#FF0000',
    //   good: '#FFFF00',
    //   excellent: '#00FF00'
    // };
    // 
    // // Quality indicator
    // ctx.fillStyle = qualityColors[detectionQuality];
    // ctx.font = "bold 18px Arial";
    // ctx.fillText(`Qualidade: ${detectionQuality === 'poor' ? 'Ruim' : 
    //                           detectionQuality === 'good' ? 'Boa' : 'Excelente'}`, 20, 30);
    
    // Exercise detection indicator
    // if (exerciseDetected) {
    //   ctx.fillStyle = 'rgba(234, 56, 76, 0.7)';
    //   ctx.font = "bold 36px Arial";
    //   ctx.fillText(exerciseConfig.detectionMessage, canvas.width/2 - 250, 60);
    //   
    //   ctx.lineWidth = 2;
    //   ctx.strokeStyle = '#FFFFFF';
    //   ctx.strokeText(exerciseConfig.detectionMessage, canvas.width/2 - 250, 60);
    // }
  };
  
  // Process pose data for specific exercises
  const processPoseForExercise = (keypoints: poseDetection.Keypoint[]) => {
    const keypointDict: {[key: string]: poseDetection.Keypoint} = {};
    keypoints.forEach(keypoint => {
      keypointDict[keypoint.name as string] = keypoint;
    });
    
    // Check visibility of keypoints for this specific exercise
    const hasRequiredKeypoints = checkExerciseVisibility(keypointDict, exercise);
    
    // Update detection quality based on keypoint visibility
    if (hasRequiredKeypoints) {
      goodDetectionFramesRef.current += 1;
      
      if (goodDetectionFramesRef.current > 30) {
        setDetectionQuality('excellent');
      } else if (goodDetectionFramesRef.current > 15) {
        setDetectionQuality('good');
      }
      
      // Provide feedback on good positioning if we've newly reached good detection
      if (goodDetectionFramesRef.current === 15) {
        updateFeedbackWithDebounce('Posicionamento bom! Pronto para começar.', 2000);
      } else if (goodDetectionFramesRef.current === 30) {
        updateFeedbackWithDebounce('Excelente posicionamento! Continue assim.', 2000);
      }
    } else {
      goodDetectionFramesRef.current = Math.max(0, goodDetectionFramesRef.current - 1);
      
      if (goodDetectionFramesRef.current < 5) {
        setDetectionQuality('poor');
        
        // Provide positioning feedback based on the specific exercise
        if (frameCountRef.current % 60 === 0) { // Only every 60 frames (approx 1-2 seconds)
          updateFeedbackWithDebounce(exerciseConfig.positioningInstructions, 3000);
        }
      } else {
        setDetectionQuality('good');
      }
    }
    
    // Analyze the pose based on the selected exercise
    switch (exercise) {
      case 'squat':
        analyzeSquat(keypoints, isDown, setIsDown, exerciseDetected, setExerciseDetected, 
                    detectionQuality, setDetectionQuality, goodDetectionFramesRef, frameCountRef, 
                    depthEstimateRef, movementHistoryRef, lastRepCountTimeRef, lastFeedbackTimeRef, 
                    setExecutionQuality, onRepetitionCount, onFeedback, updateFeedbackWithDebounce, onRepIndicatorExtracted);
        break;
      case 'lunge':
        analyzeLunge(keypoints, isDown, setIsDown, lastRepCountTimeRef, setExecutionQuality, 
                    onRepetitionCount, updateFeedbackWithDebounce, onFeedback);
        break;
      case 'pushup':
        analyzePushUp(keypoints, isDown, setIsDown, lastRepCountTimeRef, setExecutionQuality, 
                     onRepetitionCount, updateFeedbackWithDebounce, onFeedback, checkPushupAlignment);
        break;
      case 'curl':
        analyzeBicepsCurl(keypoints, isDown, setIsDown, lastRepCountTimeRef, setExecutionQuality, 
                         onRepetitionCount, updateFeedbackWithDebounce, onFeedback, isElbowStable, onRepIndicatorExtracted);
        break;
      case 'plank':
        analyzePlank(keypoints, isDown, setIsDown, lastRepCountTimeRef, setExecutionQuality, 
                    onRepetitionCount, updateFeedbackWithDebounce, onFeedback);
        break;
      default:
        // Fallback to squat analysis
        analyzeSquat(keypoints, isDown, setIsDown, exerciseDetected, setExerciseDetected, 
                    detectionQuality, setDetectionQuality, goodDetectionFramesRef, frameCountRef, 
                    depthEstimateRef, movementHistoryRef, lastRepCountTimeRef, lastFeedbackTimeRef, 
                    setExecutionQuality, onRepetitionCount, onFeedback, updateFeedbackWithDebounce, onRepIndicatorExtracted);
        break;
    }
  };
  
  // Helper to reduce feedback frequency and prevent flashing messages
  const updateFeedbackWithDebounce = (message: string, minInterval: number) => {
    const now = Date.now();
    // Only send feedback if enough time has passed since the last one
    if (now - lastFeedbackTimeRef.current > minInterval) {
      lastFeedbackTimeRef.current = now;
      onFeedback(message);
      // Show a toast notification for important messages
      if (message.includes('Repetição contabilizada') || 
          message.includes('Excelente') ||
          message.includes('Série completa')) {
        toast({
          title: "🏋️ " + message,
          duration: 1000,
        });
      }
      // Clear any pending debug info timeouts
      if (debugInfoTimeoutRef.current) {
        clearTimeout(debugInfoTimeoutRef.current);
      }
    }
  };

  return (
    <div className="relative min-h-[400px] sm:min-h-[500px] w-full">
      {/* Hidden video for pose detection */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ 
          position: 'absolute', 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          opacity: 0.01, // Almost invisible but still rendered
          zIndex: -1
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
          <p className="text-center">{isWebcamLoading ? "Acessando câmera..." : "Carregando modelo de IA..."}</p>
          <p className="text-sm text-gray-300 mt-2">Por favor, permita o acesso à câmera se solicitado</p>
        </div>
      )}

      {/* Error overlay */}
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
      
      {/* Exercise detection indicator */}
      {exerciseDetected && (
        <div className="absolute bottom-4 left-4 bg-red-500 px-4 py-2 rounded-full text-white text-base font-bold animate-pulse shadow-lg">
          {exerciseConfig.name} Detectado!
        </div>
      )}
      
      {/* Detection quality indicator */}
      <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-white text-base font-bold 
                      ${detectionQuality === 'poor' ? 'bg-red-500' : 
                        detectionQuality === 'good' ? 'bg-yellow-500' : 'bg-green-500'}`}>
        <div className="text-base font-bold max-w-full break-words">Detecção: {detectionQuality === 'poor' ? 'Ruim' : 
                 detectionQuality === 'good' ? 'Boa' : 'Excelente'}</div>
      </div>
      
      {/* Positioning instruction */}
      {detectionQuality === 'poor' && (
        <div className="absolute top-4 right-4 bg-blue-500 px-4 py-2 rounded-lg text-white text-sm font-bold animate-bounce">
          <div className="text-sm max-w-full break-words">{exerciseConfig.positioningInstructions}</div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPoseDetection;
