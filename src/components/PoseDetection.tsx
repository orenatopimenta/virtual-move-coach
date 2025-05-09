
import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
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
  const requestRef = useRef<number | null>(null);
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
    const setupCamera = async () => {
      if (!videoRef.current) return;

      try {
        console.log('Tentando acessar a câmera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
        
        videoRef.current.srcObject = stream;
        
        return new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('Câmera configurada com sucesso');
              resolve();
            };
          }
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
        console.log('Inicializando o backend TensorFlow.js...');
        const tf = await import('@tensorflow/tfjs-core');
        await import('@tensorflow/tfjs-backend-webgl');
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('Backend TensorFlow.js inicializado:', tf.getBackend());
        
        console.log('Carregando modelo MoveNet...');
        // Use MoveNet - a lightweight and fast pose detection model
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true // Enable pose smoothing
        };
        
        // Initialize the detector
        detectorRef.current = await poseDetection.createDetector(model, detectorConfig);
        console.log('Modelo MoveNet carregado com sucesso');
        setIsModelLoading(false);
      } catch (error) {
        console.error('Erro ao carregar o modelo de detecção:', error);
        setLoadError('Erro ao carregar o modelo de detecção. Tente novamente.');
        onFeedback('Erro ao carregar o modelo de detecção. Tente novamente.');
        setIsModelLoading(false);
      }
    };

    const initialize = async () => {
      try {
        await setupCamera();
        setIsWebcamLoading(false);
        await loadModel();
        
        if (videoRef.current && canvasRef.current && detectorRef.current) {
          console.log('Iniciando detecção de poses');
          startDetection();
        }
      } catch (error) {
        console.error('Erro durante a inicialização:', error);
        setLoadError('Ocorreu um erro na inicialização. Tente novamente.');
        onFeedback('Ocorreu um erro na inicialização. Tente novamente.');
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
  }, [onFeedback]);

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
      
      // Continue detection loop with lower FPS for better performance
      requestRef.current = setTimeout(() => {
        requestAnimationFrame(detectPose);
      }, 1000/24); // Targeting around 24 FPS
    } catch (error) {
      console.error('Erro durante a detecção de pose:', error);
      onFeedback('Erro na detecção. Tente reiniciar o exercício.');
      // Attempt to restart detection after a short delay
      setTimeout(() => {
        requestRef.current = requestAnimationFrame(detectPose);
      }, 2000);
    }
  };
  
  const startDetection = () => {
    if (requestRef.current) {
      clearTimeout(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(detectPose);
  };
  
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
      
      // MUITO MAIS SENSÍVEL: Reduzindo o limiar de confiança para TODAS as partes
      if (startKeypoint && endKeypoint && startKeypoint.score && endKeypoint.score && 
          startKeypoint.score > 0.2 && endKeypoint.score > 0.2) {
        
        const isLowerBody = start.includes('knee') || end.includes('knee') || 
                      start.includes('ankle') || end.includes('ankle') || 
                      start.includes('hip');
        
        // Cores especiais para as partes do corpo relevantes ao exercício
        let exerciseRelated = false;
        
        if (exercise.toLowerCase().includes('agachamento') || exercise.toLowerCase().includes('squat')) {
          exerciseRelated = isLowerBody;
        } 
        else if (exercise.toLowerCase().includes('flexão') || exercise.toLowerCase().includes('push')) {
          exerciseRelated = start.includes('shoulder') || end.includes('shoulder') || 
                          start.includes('elbow') || end.includes('elbow') ||
                          start.includes('wrist') || end.includes('wrist');
        }
        else if (exercise.toLowerCase().includes('rosca') || exercise.toLowerCase().includes('curl')) {
          exerciseRelated = start.includes('elbow') || end.includes('elbow') ||
                          start.includes('wrist') || end.includes('wrist') ||
                          start.includes('shoulder') || end.includes('shoulder');
        }
        else if (exercise.toLowerCase().includes('prancha') || exercise.toLowerCase().includes('plank')) {
          exerciseRelated = start.includes('shoulder') || end.includes('shoulder') ||
                          start.includes('hip') || end.includes('hip') ||
                          start.includes('knee') || end.includes('knee');
        }
        
        if (exerciseRelated && squatDetected) {
          ctx.strokeStyle = '#ea384c'; // Vermelho mais vivo
          ctx.lineWidth = 6; // Mais grosso
        } 
        else if (exerciseRelated) {
          ctx.strokeStyle = '#0EA5E9'; // Azul oceânico
          ctx.lineWidth = 5;
        } 
        else {
          ctx.strokeStyle = '#4361EE';
          ctx.lineWidth = 3;
        }
        
        ctx.beginPath();
        ctx.moveTo(startKeypoint.x, startKeypoint.y);
        ctx.lineTo(endKeypoint.x, endKeypoint.y);
        ctx.stroke();
      }
    });
    
    // Draw individual keypoints with improved visibility
    keypoints.forEach(keypoint => {
      // MUITO MAIS SENSÍVEL: Reduzindo drasticamente o limiar
      const confidenceThreshold = 0.2;
      
      if (keypoint.score && keypoint.score > confidenceThreshold) {
        // Check if this keypoint is related to the exercise
        let isExercisePoint = false;
        
        if (exercise.toLowerCase().includes('agachamento') || exercise.toLowerCase().includes('squat')) {
          isExercisePoint = keypoint.name?.includes('knee') || 
                         keypoint.name?.includes('ankle') || 
                         keypoint.name?.includes('hip');
        } 
        else if (exercise.toLowerCase().includes('flexão') || exercise.toLowerCase().includes('push')) {
          isExercisePoint = keypoint.name?.includes('shoulder') || 
                         keypoint.name?.includes('elbow') || 
                         keypoint.name?.includes('wrist');
        }
        else if (exercise.toLowerCase().includes('rosca') || exercise.toLowerCase().includes('curl')) {
          isExercisePoint = keypoint.name?.includes('shoulder') || 
                         keypoint.name?.includes('elbow') || 
                         keypoint.name?.includes('wrist');
        }
        else if (exercise.toLowerCase().includes('prancha') || exercise.toLowerCase().includes('plank')) {
          isExercisePoint = keypoint.name?.includes('shoulder') || 
                         keypoint.name?.includes('hip') || 
                         keypoint.name?.includes('knee') || 
                         keypoint.name?.includes('ankle');
        }
        
        if (isExercisePoint) {
          if (squatDetected && (exercise.toLowerCase().includes('agachamento') || exercise.toLowerCase().includes('squat'))) {
            // Vermelho VIVO quando agachado
            ctx.fillStyle = '#ea384c';
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 10, 0, 2 * Math.PI); // Pontos MAIORES
            ctx.fill();
            
            // Contorno branco para destacar mais
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            // Azul mais vibrante para pontos relacionados ao exercício
            ctx.fillStyle = '#0EA5E9';
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 8, 0, 2 * Math.PI);
            ctx.fill();
          }
          
          // Adicionar etiqueta para ângulos relevantes
          if (exercise.toLowerCase().includes('agachamento') || exercise.toLowerCase().includes('squat')) {
            if (keypoint.name?.includes('knee')) {
              displayJointAngle(ctx, keypointDict, 'knee', 'hip', 'ankle');
            }
          }
          else if (exercise.toLowerCase().includes('flexão') || exercise.toLowerCase().includes('push')) {
            if (keypoint.name?.includes('elbow')) {
              displayJointAngle(ctx, keypointDict, 'elbow', 'shoulder', 'wrist');
            }
          }
          else if (exercise.toLowerCase().includes('rosca') || exercise.toLowerCase().includes('curl')) {
            if (keypoint.name?.includes('elbow')) {
              displayJointAngle(ctx, keypointDict, 'elbow', 'shoulder', 'wrist');
            }
          }
        } else {
          // Outras partes do corpo
          ctx.fillStyle = '#F72585';
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });
    
    // Adicionar um indicador visual da qualidade da detecção
    const qualityColors = {
      poor: '#FF0000',
      good: '#FFFF00',
      excellent: '#00FF00'
    };
    
    // Indicador de qualidade no canto superior
    ctx.fillStyle = qualityColors[detectionQuality];
    ctx.font = "bold 18px Arial";
    ctx.fillText(`Qualidade: ${detectionQuality === 'poor' ? 'Ruim' : 
                              detectionQuality === 'good' ? 'Boa' : 'Excelente'}`, 20, 30);
    
    // Indicador visual de exercício detectado
    if (squatDetected && (exercise.toLowerCase().includes('agachamento') || exercise.toLowerCase().includes('squat'))) {
      ctx.fillStyle = 'rgba(234, 56, 76, 0.7)'; // Vermelho semi-transparente
      ctx.font = "bold 36px Arial";
      ctx.fillText("AGACHAMENTO DETECTADO!", canvas.width/2 - 250, 60);
      
      // Borda para destacar o texto
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeText("AGACHAMENTO DETECTADO!", canvas.width/2 - 250, 60);
    }
  };
  
  // Helper function to display joint angles
  const displayJointAngle = (ctx: CanvasRenderingContext2D, keypointDict: any, joint: string, parent: string, child: string) => {
    const sides = ['left_', 'right_'];
    
    for (const side of sides) {
      const jointPoint = keypointDict[`${side}${joint}`];
      const parentPoint = keypointDict[`${side}${parent}`];
      const childPoint = keypointDict[`${side}${child}`];
      
      if (jointPoint && parentPoint && childPoint && 
          jointPoint.score && parentPoint.score && childPoint.score && 
          jointPoint.score > 0.2 && parentPoint.score > 0.2 && childPoint.score > 0.2) {
        
        const angle = calculateAngle(parentPoint, jointPoint, childPoint);
        
        // Texto mais visível
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.font = "bold 16px Arial";
        
        // Desenhar sombra para o texto
        ctx.strokeText(`${Math.round(angle)}°`, jointPoint.x + 15, jointPoint.y);
        ctx.fillText(`${Math.round(angle)}°`, jointPoint.x + 15, jointPoint.y);
      }
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
      
      {/* Visual squat indicator - MAIS VISÍVEL */}
      {squatDetected && exercise.toLowerCase().includes('agachamento') && (
        <div className="absolute bottom-4 left-4 bg-red-500 px-4 py-2 rounded-full text-white text-base font-bold animate-pulse shadow-lg">
          Agachamento Detectado!
        </div>
      )}
      
      {/* Novo indicador de qualidade de detecção */}
      <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-white text-base font-bold 
                      ${detectionQuality === 'poor' ? 'bg-red-500' : 
                        detectionQuality === 'good' ? 'bg-yellow-500' : 'bg-green-500'}`}>
        Detecção: {detectionQuality === 'poor' ? 'Ruim' : 
                 detectionQuality === 'good' ? 'Boa' : 'Excelente'}
      </div>
      
      {/* Instrução de posicionamento - Exercise specific */}
      {detectionQuality === 'poor' && exerciseConfigRef.current && (
        <div className="absolute top-4 right-4 bg-blue-500 px-4 py-2 rounded-lg text-white text-sm font-bold animate-bounce">
          {exerciseConfigRef.current.positioningInstructions}
        </div>
      )}
    </div>
  );
};

export default PoseDetection;
