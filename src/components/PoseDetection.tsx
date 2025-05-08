
import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
// Importando explicitamente o backend WebGL
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
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Exercise state tracking
  const [isDown, setIsDown] = useState(false);
  const [repInProgress, setRepInProgress] = useState(false);
  const keypointsRef = useRef<any[]>([]);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const prevKneeAngleRef = useRef<number>(180);
  const repCountDebounceRef = useRef<boolean>(false);
  
  // Visual feedback for squat
  const [squatDetected, setSquatDetected] = useState(false);

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
        // Definindo explicitamente o backend WebGL
        const tf = await import('@tensorflow/tfjs-core');
        const tfwebgl = await import('@tensorflow/tfjs-backend-webgl');
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('Backend TensorFlow.js inicializado:', tf.getBackend());
        
        console.log('Carregando modelo MoveNet...');
        // Use MoveNet - a lightweight and fast pose detection model
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
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
          startKeypoint.score > 0.3 && endKeypoint.score > 0.3) {
        
        // Special coloring for leg connections when squatting
        if ((start.includes('knee') || end.includes('knee') || 
             start.includes('ankle') || end.includes('ankle') || 
             start.includes('hip')) && squatDetected) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 5;
        } else {
          ctx.strokeStyle = '#4361EE';
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
      // Reduced confidence threshold for lower body parts to make detection more sensitive
      const confidenceThreshold = keypoint.name?.includes('knee') || 
                                 keypoint.name?.includes('ankle') || 
                                 keypoint.name?.includes('hip') ? 0.3 : 0.5;
      
      if (keypoint.score && keypoint.score > confidenceThreshold) {
        // Change color of leg keypoints when squatting is detected
        if ((keypoint.name?.includes('knee') || 
             keypoint.name?.includes('ankle') || 
             keypoint.name?.includes('hip')) && squatDetected) {
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, 8, 0, 2 * Math.PI); // Larger points for leg joints
          ctx.fill();
          
          // Add label for knee angle if it's a knee
          if (keypoint.name?.includes('knee') && exercise === 'Agachamento') {
            const keypointDict: {[key: string]: poseDetection.Keypoint} = {};
            keypoints.forEach(kp => {
              keypointDict[kp.name as string] = kp;
            });
            
            const leftHip = keypointDict['left_hip'];
            const leftKnee = keypointDict['left_knee'];
            const leftAnkle = keypointDict['left_ankle'];
            
            if (leftHip && leftKnee && leftAnkle && leftHip.score && 
                leftKnee.score && leftAnkle.score && 
                leftHip.score > 0.3 && leftKnee.score > 0.3 && leftAnkle.score > 0.3) {
              const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
              
              ctx.fillStyle = "#FFFFFF";
              ctx.font = "14px Arial";
              ctx.fillText(`${Math.round(kneeAngle)}°`, leftKnee.x + 15, leftKnee.y);
            }
          }
        } else {
          ctx.fillStyle = '#F72585';
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
          ctx.fill();
        }
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
    
    // Verificar se os pontos necessários foram detectados com confiança reduzida
    const hasGoodVisibility = leftHip?.score > 0.3 && leftKnee?.score > 0.3 && leftAnkle?.score > 0.3 && 
                           rightHip?.score > 0.3 && rightKnee?.score > 0.3 && rightAnkle?.score > 0.3;
    
    if (hasGoodVisibility) {
      // Calcular ângulos dos joelhos
      const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      
      // Média dos ângulos para maior estabilidade
      const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
      
      // Guarde o ângulo atual para comparação
      const prevAngle = prevKneeAngleRef.current;
      prevKneeAngleRef.current = kneeAngle;
      
      // LIMIAR DE DETECÇÃO AINDA MAIS SENSÍVEL
      // Log detalhado para debugging
      console.log(`ANÁLISE DE AGACHAMENTO - Ângulo do joelho: ${kneeAngle.toFixed(1)}, isDown: ${isDown}, squatDetected: ${squatDetected}, frameCount: ${frameCountRef.current}`);
      
      // Detecção de posição agachada - ângulo bem menor para mais sensibilidade
      if (kneeAngle < 120 && !isDown && !repCountDebounceRef.current) {
        // Atualização visual imediata quando detectar uma dobra significativa do joelho
        setSquatDetected(true);
        
        // Log de detecção
        console.log(`DETECÇÃO: Possível agachamento em progresso - Ângulo: ${kneeAngle.toFixed(1)}`);
        
        // Incrementar o contador de frames para confirmar posição - reduzido ainda mais
        frameCountRef.current += 1;
        
        // Só registre como agachamento após menos frames na posição
        if (frameCountRef.current > 1) { // Reduzido para apenas 1 frame de confirmação
          console.log(`🔴 POSIÇÃO BAIXA CONFIRMADA! Ângulo: ${kneeAngle.toFixed(1)}`);
          setIsDown(true);
          frameCountRef.current = 0;
          onFeedback('Posição baixa detectada! Continue...');
        }
      } 
      // Detecção de retorno à posição em pé - limiar reduzido para ser mais sensível
      else if (kneeAngle > 135 && isDown && !repCountDebounceRef.current) {
        // Incrementar contador de frames para confirmar posição
        frameCountRef.current += 1;
        
        // Só registre como finalizado após poucos frames na posição
        if (frameCountRef.current > 1) { // Reduzido para apenas 1 frame de confirmação
          console.log(`🟢 REPETIÇÃO CONCLUÍDA! CONTABILIZANDO... Ângulo: ${kneeAngle.toFixed(1)}`);
          setIsDown(false);
          setSquatDetected(false); // Reset do estado visual
          setRepInProgress(false);
          frameCountRef.current = 0;
          
          // Evitar contagens múltiplas com debounce
          repCountDebounceRef.current = true;
          
          // Informar que uma repetição foi concluída
          onFeedback('Boa! Repetição contabilizada.');
          onRepetitionCount();
          
          // Teste direto da função de callback para verificar se está funcionando
          console.log("Chamando callback de repetição");
          
          // Resetar o debounce após um tempo - diminuido para permitir repetições mais rápidas
          setTimeout(() => {
            repCountDebounceRef.current = false;
            console.log("Debounce resetado, pronto para nova repetição");
          }, 500);
        }
      }
      // Se estiver no meio do agachamento, manter o estado visual
      else if (kneeAngle < 135 && kneeAngle > 90) {
        setSquatDetected(true);
      }
      // Se não estiver agachado ou com o joelho muito flexionado, resetar visual
      else if (kneeAngle > 150) {
        setSquatDetected(false);
      }
      // Reset do contador se não estiver nas posições de transição
      else if ((kneeAngle >= 120 && !isDown) || (kneeAngle <= 135 && isDown)) {
        frameCountRef.current = 0;
      }
    } else {
      // Log quando não há boa visibilidade dos pontos-chave
      console.log("Visibilidade insuficiente dos pontos-chave para análise de agachamento");
      const visibilityDetails = {
        leftHip: leftHip?.score?.toFixed(2),
        leftKnee: leftKnee?.score?.toFixed(2),
        leftAnkle: leftAnkle?.score?.toFixed(2),
        rightHip: rightHip?.score?.toFixed(2),
        rightKnee: rightKnee?.score?.toFixed(2),
        rightAnkle: rightAnkle?.score?.toFixed(2)
      };
      console.log("Detalhes de visibilidade:", visibilityDetails);
      onFeedback('Posicione-se melhor para que eu possa ver suas pernas completamente.');
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
      
      {/* Visual squat indicator */}
      {squatDetected && (
        <div className="absolute bottom-4 left-4 bg-red-500 px-3 py-1 rounded-full text-white text-sm font-bold animate-pulse">
          Agachamento Detectado
        </div>
      )}
    </div>
  );
};

export default PoseDetection;
