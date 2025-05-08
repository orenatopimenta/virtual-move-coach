
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
  
  // Visual feedback for squat - IMPORTANTE: aumentando a reatividade
  const [squatDetected, setSquatDetected] = useState(false);
  // Novo estado para feedback visual da qualidade de detecção
  const [detectionQuality, setDetectionQuality] = useState<'poor' | 'good' | 'excellent'>('poor');
  // Contador de frames com boa detecção
  const goodDetectionFramesRef = useRef<number>(0);

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
      
      // MUITO MAIS SENSÍVEL: Reduzindo o limiar de confiança para TODAS as partes
      if (startKeypoint && endKeypoint && startKeypoint.score && endKeypoint.score && 
          startKeypoint.score > 0.2 && endKeypoint.score > 0.2) {
        
        // Cores especiais para as pernas durante agachamento - MAIS VIVO
        if ((start.includes('knee') || end.includes('knee') || 
             start.includes('ankle') || end.includes('ankle') || 
             start.includes('hip')) && squatDetected) {
          ctx.strokeStyle = '#ea384c'; // Vermelho mais vivo
          ctx.lineWidth = 6; // Mais grosso
        } else if (start.includes('knee') || end.includes('knee') || 
                  start.includes('ankle') || end.includes('ankle') || 
                  start.includes('hip')) {
          // Coloração especial para os membros inferiores MESMO QUANDO NÃO AGACHADO
          ctx.strokeStyle = '#0EA5E9'; // Azul oceânico
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
    
    // Draw individual keypoints with improved visibility
    keypoints.forEach(keypoint => {
      // MUITO MAIS SENSÍVEL: Reduzindo drasticamente o limiar para as pernas
      const confidenceThreshold = keypoint.name?.includes('knee') || 
                               keypoint.name?.includes('ankle') || 
                               keypoint.name?.includes('hip') ? 0.2 : 0.4;
      
      if (keypoint.score && keypoint.score > confidenceThreshold) {
        // Pontos mais destacados para as pernas - MUITO MAIS VISÍVEIS
        if ((keypoint.name?.includes('knee') || 
             keypoint.name?.includes('ankle') || 
             keypoint.name?.includes('hip'))) {
          
          if (squatDetected) {
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
            // Azul mais vibrante para membros inferiores quando não agachado
            ctx.fillStyle = '#0EA5E9';
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 8, 0, 2 * Math.PI);
            ctx.fill();
          }
          
          // Adicionar etiqueta para ângulo do joelho
          if (keypoint.name?.includes('knee') && exercise === 'Agachamento') {
            const leftHip = keypointDict['left_hip'];
            const leftKnee = keypointDict['left_knee'];
            const leftAnkle = keypointDict['left_ankle'];
            
            if (leftHip && leftKnee && leftAnkle && leftHip.score && 
                leftKnee.score && leftAnkle.score && 
                leftHip.score > 0.2 && leftKnee.score > 0.2 && leftAnkle.score > 0.2) {
              const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
              
              // Texto mais visível
              ctx.fillStyle = "#FFFFFF";
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 3;
              ctx.font = "bold 16px Arial";
              
              // Desenhar sombra para o texto
              ctx.strokeText(`${Math.round(kneeAngle)}°`, leftKnee.x + 15, leftKnee.y);
              ctx.fillText(`${Math.round(kneeAngle)}°`, leftKnee.x + 15, leftKnee.y);
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
    
    // Indicador visual grande de agachamento
    if (squatDetected) {
      ctx.fillStyle = 'rgba(234, 56, 76, 0.7)'; // Vermelho semi-transparente
      ctx.font = "bold 36px Arial";
      ctx.fillText("AGACHAMENTO DETECTADO!", canvas.width/2 - 250, 60);
      
      // Borda para destacar o texto
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeText("AGACHAMENTO DETECTADO!", canvas.width/2 - 250, 60);
    }
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
        onFeedback('Boa! Repetição contabilizada.');
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
    } else {
      // Feedback mais detalhado quando não há boa detecção
      console.log("⚠️ Visibilidade insuficiente dos pontos-chave");
      const visibilityDetails = {
        leftHip: leftHip?.score?.toFixed(2) || "não detectado",
        leftKnee: leftKnee?.score?.toFixed(2) || "não detectado",
        leftAnkle: leftAnkle?.score?.toFixed(2) || "não detectado",
        rightHip: rightHip?.score?.toFixed(2) || "não detectado",
        rightKnee: rightKnee?.score?.toFixed(2) || "não detectado",
        rightAnkle: rightAnkle?.score?.toFixed(2) || "não detectado"
      };
      console.log("Detalhes de visibilidade:", visibilityDetails);
      
      // Feedback apenas se a qualidade estiver ruim por vários frames
      if (detectionQuality === 'poor' && frameCountRef.current % 30 === 0) {
        onFeedback('Afaste-se um pouco da câmera para que eu possa ver suas pernas completamente.');
      }
      frameCountRef.current += 1;
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
      
      {/* Visual squat indicator - MAIS VISÍVEL */}
      {squatDetected && (
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
      
      {/* Instrução de posicionamento */}
      {detectionQuality === 'poor' && (
        <div className="absolute top-4 right-4 bg-blue-500 px-4 py-2 rounded-lg text-white text-sm font-bold animate-bounce">
          Afaste-se um pouco para a câmera ver suas pernas completas
        </div>
      )}
    </div>
  );
};

export default PoseDetection;
