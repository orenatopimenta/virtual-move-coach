import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { getExerciseConfig } from './pose-analysis/exercise-configs';
import { calculateAngle } from './pose-analysis/utils';
import { useToast } from "@/hooks/use-toast";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Exercise state tracking
  const [isDown, setIsDown] = useState(false);
  const [repInProgress, setRepInProgress] = useState(false);
  const [squatDetected, setSquatDetected] = useState(false);
  const [detectionQuality, setDetectionQuality] = useState<'poor' | 'good' | 'excellent'>('poor');
  
  const keypointsRef = useRef<any[]>([]);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  // Use uma união de tipos para o requestRef para acomodar tanto requestAnimationFrame quanto setTimeout
  const requestRef = useRef<number | NodeJS.Timeout | null>(null);
  const frameCountRef = useRef<number>(0);
  const prevKneeAngleRef = useRef<number>(180);
  const repCountDebounceRef = useRef<boolean>(false);
  const goodDetectionFramesRef = useRef<number>(0);
  const lastFeedbackTimeRef = useRef<number>(Date.now());
  const exerciseConfigRef = useRef<any>(null);
  
  const { toast } = useToast();
  
  // Set the exercise configuration
  useEffect(() => {
    // Get the appropriate configuration for this exercise
    const config = getExerciseConfig(exercise.toLowerCase().replace(/\s+/g, ''));
    exerciseConfigRef.current = config;
    
    // Reset states
    setIsDown(false);
    setRepInProgress(false);
    setSquatDetected(false);
    frameCountRef.current = 0;
    goodDetectionFramesRef.current = 0;
    
    // Provide initial positioning instructions
    onFeedback(config.positioningInstructions || 'Posicione-se em frente à câmera');
  }, [exercise, onFeedback]);

  useEffect(() => {
    let isMounted = true;
    let animationId: number | null = null;

    const setupCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
<<<<<<< Updated upstream
            width: { ideal: 192 }, // Reduzir para melhorar performance
            height: { ideal: 192 },
            frameRate: { ideal: 3, max: 5 }
=======
            width: { ideal: 480 },
            height: { ideal: 360 }
>>>>>>> Stashed changes
          },
          audio: false
        });
        videoRef.current.srcObject = stream;
        await new Promise(resolve => {
          videoRef.current!.onloadedmetadata = () => resolve(null);
        });
      } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        setLoadError('Erro ao acessar câmera. Verifique suas permissões.');
        onFeedback('Erro ao acessar câmera. Verifique suas permissões.');
      }
    };

    const loadModel = async () => {
      setIsModelLoading(true);
      try {
        await import('@tensorflow/tfjs-backend-webgl');
        await tf.setBackend('webgl');
        await tf.ready();
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true
        };
        detectorRef.current = await poseDetection.createDetector(model, detectorConfig);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Erro ao carregar o modelo de detecção:', error);
        setLoadError('Erro ao carregar o modelo de detecção. Tente novamente.');
        onFeedback('Erro ao carregar o modelo de detecção. Tente novamente.');
        setIsModelLoading(false);
      }
    };

    const detectPose = async () => {
      if (!detectorRef.current || !videoRef.current || !canvasRef.current) return;
      if (videoRef.current.readyState < 2) {
        animationId = requestAnimationFrame(detectPose);
        return;
      }
      // Ajusta o canvas para o tamanho do vídeo
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      try {
        const poses = await detectorRef.current.estimatePoses(videoRef.current);
        if (poses.length > 0 && poses[0].keypoints) {
          // desenha keypoints
          for (const kp of poses[0].keypoints) {
            if (kp.score > 0.4) {
              ctx?.beginPath();
              ctx?.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
              ctx!.fillStyle = 'red';
              ctx?.fill();
            }
          }
          keypointsRef.current = poses[0].keypoints;
          processPoseForExercise(poses[0].keypoints);
        }
      } catch (error) {
        console.error('Erro durante a detecção de pose:', error);
        onFeedback('Erro na detecção. Tente reiniciar o exercício.');
      }
      await tf.nextFrame();
      if (isMounted) animationId = requestAnimationFrame(detectPose);
    };

    const initialize = async () => {
      await setupCamera();
      setIsWebcamLoading(false);
      await loadModel();
      if (videoRef.current && canvasRef.current && detectorRef.current) {
        detectPose();
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (requestRef.current) {
        if (typeof requestRef.current === 'number') {
          cancelAnimationFrame(requestRef.current);
        } else {
          clearTimeout(requestRef.current);
        }
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onFeedback]);

<<<<<<< Updated upstream
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
      
      // Limitar taxa de atualização para melhorar performance
      requestRef.current = setTimeout(() => {
        if (requestRef.current && typeof requestRef.current !== 'number') {
          clearTimeout(requestRef.current);
        }
        requestRef.current = requestAnimationFrame(() => detectPose());
      }, 333); // Reduzir para 15 FPS para melhor performance
    } catch (error) {
      console.error('Erro durante a detecção de pose:', error);
      onFeedback('Erro na detecção. Tente reiniciar o exercício.');
      // Attempt to restart detection after a short delay
      setTimeout(() => {
        requestRef.current = requestAnimationFrame(() => detectPose());
      }, 333);
    }
  };
  
  const startDetection = () => {
    if (requestRef.current) {
      if (typeof requestRef.current === 'number') {
        cancelAnimationFrame(requestRef.current);
      } else {
        clearTimeout(requestRef.current);
      }
    }
    requestRef.current = requestAnimationFrame(() => detectPose());
  };
  
=======
>>>>>>> Stashed changes
  const drawPose = (pose: poseDetection.Pose, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !videoRef.current) return;
    
    // Set canvas dimensions if they don't match the video
    if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    }
    
    // Draw the video frame first (shows the person)
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Draw keypoints
    const keypoints = pose.keypoints;
    
    // Otimização: Limitar número de elementos visuais
    // Reduzir a complexidade do desenho para melhorar a performance

    // Usar um conjunto simplificado de conexões para o esqueleto
    const connections = [
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle'],
      ['left_shoulder', 'right_shoulder'],
      ['left_hip', 'right_hip'],
    ];
    
    // Get keypoints as a dictionary for easier access
    const keypointDict: {[key: string]: poseDetection.Keypoint} = {};
    keypoints.forEach(keypoint => {
      keypointDict[keypoint.name as string] = keypoint;
    });
    
    // Draw the connections more efficiently
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0EA5E9';
    
    connections.forEach(([start, end]) => {
      const startKeypoint = keypointDict[start];
      const endKeypoint = keypointDict[end];
      
      if (startKeypoint?.score && endKeypoint?.score && 
          startKeypoint.score > 0.3 && endKeypoint.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(startKeypoint.x, startKeypoint.y);
        ctx.lineTo(endKeypoint.x, endKeypoint.y);
        ctx.stroke();
      }
    });
    
    // Draw only important keypoints
    const importantJoints = [
      'left_shoulder', 'right_shoulder', 
      'left_elbow', 'right_elbow',
      'left_wrist', 'right_wrist',
      'left_hip', 'right_hip',
      'left_knee', 'right_knee',
      'left_ankle', 'right_ankle'
    ];
    
    ctx.fillStyle = '#F72585';
    importantJoints.forEach(joint => {
      const keypoint = keypointDict[joint];
      if (keypoint?.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    
    // Indicador de qualidade com estilo simplificado
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = detectionQuality === 'poor' ? '#FF0000' : 
                  detectionQuality === 'good' ? '#FFFF00' : '#00FF00';
    ctx.fillText(`Qualidade: ${detectionQuality === 'poor' ? 'Ruim' : 
                detectionQuality === 'good' ? 'Boa' : 'Excelente'}`, 20, 30);
    
    // Visual indicator when movement is detected - simplified
    if (squatDetected && exercise.toLowerCase().includes('agachamento')) {
      ctx.fillStyle = 'rgba(234, 56, 76, 0.7)';
      ctx.font = "bold 24px Arial";
      ctx.fillText("AGACHAMENTO DETECTADO!", 50, 60);
    }
  };
  
  const processPoseForExercise = (keypoints: poseDetection.Keypoint[]) => {
    const keypointDict: {[key: string]: poseDetection.Keypoint} = {};
    keypoints.forEach(keypoint => {
      keypointDict[keypoint.name as string] = keypoint;
    });
    
    if (!exerciseConfigRef.current) return;
    
    // Check visibility of required keypoints
    const requiredKeypoints = exerciseConfigRef.current.requiredKeypoints;
    let visibleKeypoints = 0;
    let totalRequiredKeypoints = requiredKeypoints.length;
    
    for (const point of requiredKeypoints) {
      const keypoint = keypointDict[point];
      if (keypoint && keypoint.score && keypoint.score > 0.2) {
        visibleKeypoints++;
      }
    }
    
    // Set detection quality based on visibility
    const visibilityPercentage = (visibleKeypoints / totalRequiredKeypoints) * 100;
    
    if (visibilityPercentage < 50) {
      setDetectionQuality('poor');
      goodDetectionFramesRef.current = 0;
      
      // Show positioning instructions specific to the exercise
      if (frameCountRef.current % 30 === 0) { // Throttle to avoid spam
        onFeedback(exerciseConfigRef.current.positioningInstructions);
      }
    } else if (visibilityPercentage < 80) {
      setDetectionQuality('good');
      goodDetectionFramesRef.current += 1;
      
      if (goodDetectionFramesRef.current === 10) {
        onFeedback('Posição melhorando! Continue ajustando para visibilidade ideal.');
      }
    } else {
      setDetectionQuality('excellent');
      goodDetectionFramesRef.current += 1;
      
      if (goodDetectionFramesRef.current === 10) {
        onFeedback('Excelente posição! Visibilidade perfeita.');
      }
    }
    
    // Process based on exercise type
    switch (exercise.toLowerCase().replace(/\s+/g, '')) {
      case 'agachamento':
      case 'squat':
        analyzeSquat(keypointDict);
        break;
      case 'flexãodebraço':
      case 'flexão':
      case 'pushup':
        analyzePushUp(keypointDict);
        break;
      case 'roscabíceps':
      case 'rosca':
      case 'curl':
        analyzeBicepsCurl(keypointDict);
        break;
      case 'prancha':
      case 'plank':
        analyzePlank(keypointDict);
        break;
      case 'avanço':
      case 'lunge':
        analyzeLunge(keypointDict);
        break;
      default:
        // Default to squat analysis
        analyzeSquat(keypointDict);
    }
    
    frameCountRef.current++;
  };
  
  const analyzeSquat = (keypoints: {[key: string]: poseDetection.Keypoint}) => {
    const leftHip = keypoints['left_hip'];
    const leftKnee = keypoints['left_knee'];
    const leftAnkle = keypoints['left_ankle'];
    const rightHip = keypoints['right_hip'];
    const rightKnee = keypoints['right_knee'];
    const rightAnkle = keypoints['right_ankle'];
    
    // Verificar qualidade de detecção - limiar muito mais baixo para membros inferiores
    const hasGoodVisibility = leftHip?.score > 0.2 && leftKnee?.score > 0.2 && leftAnkle?.score > 0.2 && 
                           rightHip?.score > 0.2 && rightKnee?.score > 0.2 && rightAnkle?.score > 0.2;
    
    // Mostrar qualidade da detecção para ajudar o usuário
    if (leftHip?.score && leftKnee?.score && leftAnkle?.score) {
      const avgScore = (leftHip.score + leftKnee.score + leftAnkle.score) / 3;
      
      // Log com scores exatos para debugging
      console.log(`Scores de detecção: Quadril=${leftHip.score.toFixed(2)}, Joelho=${leftKnee.score.toFixed(2)}, Tornozelo=${leftAnkle.score.toFixed(2)}, Média=${avgScore.toFixed(2)}`);
      
      if (avgScore < 0.3) {
        setDetectionQuality('poor');
        goodDetectionFramesRef.current = 0;
      } else if (avgScore < 0.5) {
        setDetectionQuality('good');
        // Incrementa contador de frames com boa detecção
        goodDetectionFramesRef.current += 1;
        
        // Atualiza o feedback após alguns frames com boa detecção
        if (goodDetectionFramesRef.current > 5 && goodDetectionFramesRef.current % 10 === 0) {
          onFeedback('Posição melhorando! Continue ajustando para visibilidade ideal.');
        }
      } else {
        setDetectionQuality('excellent');
        // Incrementa contador de frames com boa detecção
        goodDetectionFramesRef.current += 1;
        
        // Atualiza o feedback após alguns frames com boa detecção
        if (goodDetectionFramesRef.current === 10) {
          onFeedback('Excelente posição! Suas pernas estão claramente visíveis.');
        }
      }
    }
    
    // Mesmo com visibilidade ruim, tentar analisar - MUITO MAIS PERMISSIVO
    if (leftHip && leftKnee && leftAnkle) {
      // Calcular ângulos dos joelhos - usar apenas o lado esquerdo se necessário
      const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      let kneeAngle = leftKneeAngle;
      
      // Se o lado direito também estiver visível, calcular a média
      if (rightHip && rightKnee && rightAnkle) {
        const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
      }
      
      // Guarde o ângulo atual para comparação
      const prevAngle = prevKneeAngleRef.current;
      prevKneeAngleRef.current = kneeAngle;
      
      // Log detalhado para análise
      console.log(`ANÁLISE DE AGACHAMENTO - Ângulo atual: ${kneeAngle.toFixed(1)}°, Ângulo anterior: ${prevAngle.toFixed(1)}°, isDown: ${isDown}, squatDetected: ${squatDetected}`);
      
      // ALTAMENTE SENSÍVEL - detectar qualquer dobra significativa do joelho
      // Detecção de posição agachada - muito mais sensível (ângulo até 145°)
      if (kneeAngle < 145 && !isDown && !repCountDebounceRef.current) {
        // Atualização visual imediata
        setSquatDetected(true);
        
        console.log(`🔍 DETECTADO: Possível agachamento iniciado - Ângulo: ${kneeAngle.toFixed(1)}°`);
        
        // MUITO MAIS REATIVO: Não precisa confirmar com frames adicionais
        console.log(`🔴 POSIÇÃO BAIXA IMEDIATAMENTE CONFIRMADA! Ângulo: ${kneeAngle.toFixed(1)}°`);
        setIsDown(true);
        frameCountRef.current = 0;
        onFeedback('Agachamento detectado! Mantenha a posição...');
      } 
      // Detecção de retorno à posição em pé - muito mais sensível
      else if (kneeAngle > 160 && isDown && !repCountDebounceRef.current) {
        console.log(`🟢 REPETIÇÃO IMEDIATAMENTE CONCLUÍDA! Ângulo: ${kneeAngle.toFixed(1)}°`);
        setIsDown(false);
        setSquatDetected(false);
        setRepInProgress(false);
        frameCountRef.current = 0;
        
        // Evitar contagens múltiplas com debounce mais curto
        repCountDebounceRef.current = true;
        
        // Informar que uma repetição foi concluída
        sendFeedbackIfReady('Boa! Repetição contabilizada.');
        onRepetitionCount();
        
        console.log("🎯 Chamando callback de repetição - contabilizando agachamento");
        
        // Resetar o debounce mais rápido
        setTimeout(() => {
          repCountDebounceRef.current = false;
          console.log("⏱️ Debounce resetado, pronto para nova repetição");
        }, 300);
      }
      // Se estiver no meio do agachamento, manter o estado visual
      else if (kneeAngle < 150) {
        setSquatDetected(true);
      }
      // Se o joelho estiver praticamente esticado, resetar visual
      else if (kneeAngle > 165) {
        setSquatDetected(false);
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
      
      // Also check right arm if visible
      let elbowAngle = leftElbowAngle;
      if (rightShoulder?.score && rightElbow?.score && rightWrist?.score &&
          rightShoulder.score > 0.5 && rightElbow.score > 0.5 && rightWrist.score > 0.5) {
        const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
        elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
      }
      
      // Check if arms are bent (push-up down position)
      if (elbowAngle < 110 && !isDown && !repCountDebounceRef.current) {
        setIsDown(true);
        onFeedback('Posição baixa! Mantenha o corpo alinhado.');
      } 
      // Check if arms are straight (push-up up position)
      else if (elbowAngle > 160 && isDown && !repCountDebounceRef.current) {
        setIsDown(false);
        
        // Avoid multiple counts
        repCountDebounceRef.current = true;
        
        sendFeedbackIfReady('Excelente flexão! Repetição contabilizada.');
        onRepetitionCount();
        
        setTimeout(() => {
          repCountDebounceRef.current = false;
        }, 300);
      }
    } else {
      // If key parts aren't visible
      if (frameCountRef.current % 30 === 0) {
        onFeedback('Posicione a câmera para ver seu tronco e braços completos');
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
      if (elbowAngle < 80 && !isDown && !repCountDebounceRef.current) {
        setIsDown(true);
        onFeedback('Posição alta correta. Segure brevemente.');
      } 
      // Check if arm is straight (curl down position)
      else if (elbowAngle > 150 && isDown && !repCountDebounceRef.current) {
        setIsDown(false);
        
        // Avoid multiple counts
        repCountDebounceRef.current = true;
        
        sendFeedbackIfReady('Correto! Repetição contabilizada.');
        onRepetitionCount();
        
        setTimeout(() => {
          repCountDebounceRef.current = false;
        }, 300);
      }
    } else {
      // If key parts aren't visible
      if (frameCountRef.current % 30 === 0) {
        onFeedback('Posicione-se para que seus braços estejam visíveis');
      }
    }
  };

  const analyzePlank = (keypoints: {[key: string]: poseDetection.Keypoint}) => {
    const leftShoulder = keypoints['left_shoulder'];
    const leftHip = keypoints['left_hip'];
    const leftKnee = keypoints['left_knee'];
    const leftAnkle = keypoints['left_ankle'];
    
    if (leftShoulder?.score && leftHip?.score && leftKnee?.score && leftAnkle?.score &&
        leftShoulder.score > 0.3 && leftHip.score > 0.3 && leftKnee.score > 0.3 && leftAnkle.score > 0.3) {
        
      // Calculate body alignment angles
      const torsoAngle = calculateAngle(
        { x: leftShoulder.x, y: leftShoulder.y - 100 }, // Point above shoulder
        leftShoulder,
        leftHip
      );
      
      const legAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      
      // Check for horizontal alignment
      if (Math.abs(180 - torsoAngle) < 20 && Math.abs(180 - legAngle) < 30) {
        if (!isDown) {
          setIsDown(true);
          onFeedback('Prancha detectada! Mantenha a posição reta.');
        }
        
        // Count time instead of reps for plank
        // This would need additional tracking for time spent in plank position
      } else {
        if (isDown) {
          setIsDown(false);
          onFeedback('Mantenha o corpo alinhado em linha reta.');
        }
      }
    } else {
      if (frameCountRef.current % 30 === 0) {
        onFeedback('Posicione a câmera lateralmente para ver seu corpo na horizontal');
      }
    }
  };

  const analyzeLunge = (keypoints: {[key: string]: poseDetection.Keypoint}) => {
    const leftHip = keypoints['left_hip'];
    const leftKnee = keypoints['left_knee'];
    const leftAnkle = keypoints['left_ankle'];
    const rightHip = keypoints['right_hip'];
    const rightKnee = keypoints['right_knee'];
    const rightAnkle = keypoints['right_ankle'];
    
    if (leftKnee?.score && leftAnkle?.score && rightKnee?.score && rightAnkle?.score &&
        leftKnee.score > 0.3 && leftAnkle.score > 0.3 && rightKnee.score > 0.3 && rightAnkle.score > 0.3) {
      
      // Calculate knee angles
      const leftKneeAngle = calculateAngle(leftHip || {x: leftKnee.x, y: leftKnee.y - 100}, leftKnee, leftAnkle);
      const rightKneeAngle = calculateAngle(rightHip || {x: rightKnee.x, y: rightKnee.y - 100}, rightKnee, rightAnkle);
      
      // For lunge, one knee should be bent significantly while the other is straighter
      const kneeAngleDiff = Math.abs(leftKneeAngle - rightKneeAngle);
      
      if (kneeAngleDiff > 30 && (leftKneeAngle < 130 || rightKneeAngle < 130) && !isDown && !repCountDebounceRef.current) {
        setIsDown(true);
        onFeedback('Avanço detectado! Mantenha a posição...');
      }
      // Return to standing position
      else if (leftKneeAngle > 160 && rightKneeAngle > 160 && isDown && !repCountDebounceRef.current) {
        setIsDown(false);
        
        // Avoid multiple counts
        repCountDebounceRef.current = true;
        
        sendFeedbackIfReady('Excelente! Repetição contabilizada.');
        onRepetitionCount();
        
        setTimeout(() => {
          repCountDebounceRef.current = false;
        }, 300);
      }
    } else {
      if (frameCountRef.current % 30 === 0) {
        onFeedback('Afaste-se para a câmera ver suas pernas completas');
      }
    }
  };

  // Helper to reduce feedback frequency
  const sendFeedbackIfReady = (message: string) => {
    const now = Date.now();
    if (now - lastFeedbackTimeRef.current > 1000) { // At least 1 second between feedbacks
      lastFeedbackTimeRef.current = now;
      onFeedback(message);
    }
  };

  return (
    <div className="relative h-full">
      {/* Hidden video for pose detection */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
        width="480"
        height="360"
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
        className="w-full h-full object-cover rounded-lg"
        style={{height: '100%', width: '100%'}}
      />
      
      {/* Loading overlays */}
      {(isModelLoading || isWebcamLoading) && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white min-h-[180px] sm:min-h-[220px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p>{isWebcamLoading ? "Acessando câmera..." : "Carregando modelo de IA..."}</p>
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
      
      {/* Indicators simplified for better performance */}
      {squatDetected && exercise.toLowerCase().includes('agachamento') && (
        <div className="absolute bottom-4 left-4 bg-red-500 px-3 py-1 rounded-full text-white text-sm font-bold">
          Agachamento Detectado!
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

export default PoseDetection;
