import { Keypoint } from '@tensorflow-models/pose-detection';

/**
 * Analyzes squat form using pose detection
 */
export const analyzeSquat = (
  keypoints: Keypoint[],
  isDown: boolean, 
  setIsDown: React.Dispatch<React.SetStateAction<boolean>>,
  squatDetected: boolean,
  setSquatDetected: React.Dispatch<React.SetStateAction<boolean>>, 
  detectionQuality: 'poor' | 'good' | 'excellent',
  setDetectionQuality: React.Dispatch<React.SetStateAction<'poor' | 'good' | 'excellent'>>,
  goodDetectionFramesRef: React.MutableRefObject<number>,
  frameCountRef: React.MutableRefObject<number>,
  depthEstimateRef: React.MutableRefObject<{[key: string]: number}>,
  movementHistoryRef: React.MutableRefObject<{[key: string]: number[]}>,
  lastRepCountTimeRef: React.MutableRefObject<number>,
  lastFeedbackTimeRef: React.MutableRefObject<number>,
  setExecutionQuality: React.Dispatch<React.SetStateAction<'good' | 'average' | 'poor' | null>>,
  onRepetitionCount: (quality: 'good' | 'average' | 'poor') => void,
  onFeedback: (message: string) => void,
  updateFeedbackWithDebounce: (message: string, minInterval: number) => void,
  onRepIndicatorExtracted?: (indicator: any) => void
) => {
  // Create a dictionary of keypoints for easier access
  const keypointDict: {[key: string]: Keypoint} = {};
  keypoints.forEach(keypoint => {
    keypointDict[keypoint.name as string] = keypoint;
  });

  const leftHip = keypointDict['left_hip'];
  const leftKnee = keypointDict['left_knee'];
  const leftAnkle = keypointDict['left_ankle'];
  const rightHip = keypointDict['right_hip'];
  const rightKnee = keypointDict['right_knee'];
  const rightAnkle = keypointDict['right_ankle'];
  
  // Verify detection quality - much lower threshold for lower body
  const hasGoodVisibility = leftHip?.score > 0.2 && leftKnee?.score > 0.2 && leftAnkle?.score > 0.2 && 
                          rightHip?.score > 0.2 && rightKnee?.score > 0.2 && rightAnkle?.score > 0.2;
  
  // Update detection quality for user feedback
  if (leftHip?.score && leftKnee?.score && leftAnkle?.score) {
    const avgScore = (leftHip.score + leftKnee.score + leftAnkle.score) / 3;
    
    // Log exact detection scores for debugging
    console.log(`Squat detection scores: Hip=${leftHip.score.toFixed(2)}, Knee=${leftKnee.score.toFixed(2)}, Ankle=${leftAnkle.score.toFixed(2)}, Avg=${avgScore.toFixed(2)}`);
    
    if (avgScore < 0.3) {
      setDetectionQuality('poor');
      goodDetectionFramesRef.current = 0;
    } else if (avgScore < 0.5) {
      setDetectionQuality('good');
      // Increment good detection frames counter
      goodDetectionFramesRef.current += 1;
      
      // Update feedback after several frames of good detection
      if (goodDetectionFramesRef.current > 5 && goodDetectionFramesRef.current % 10 === 0) {
        updateFeedbackWithDebounce('Posição melhorando! Continue ajustando para visibilidade ideal.', 3000);
      }
    } else {
      setDetectionQuality('excellent');
      // Increment good detection frames counter
      goodDetectionFramesRef.current += 1;
      
      // Update feedback after several frames of good detection
      if (goodDetectionFramesRef.current === 10) {
        updateFeedbackWithDebounce('Excelente posição! Suas pernas estão claramente visíveis.', 3000);
      }
    }
  }
  
  const now = Date.now();
  const minInterval = 300; // 300ms entre repetições

  const leftOk = leftHip?.score > 0.5 && leftKnee?.score > 0.5 && leftAnkle?.score > 0.5;
  const rightOk = rightHip?.score > 0.5 && rightKnee?.score > 0.5 && rightAnkle?.score > 0.5;

  let kneeAngle = null;
  if (leftOk && rightOk) {
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
  } else if (leftOk) {
    kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  } else if (rightOk) {
    kneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  }

  const downThreshold = 120; // ângulo para considerar agachado
  const upThreshold = 155;   // ângulo para considerar em pé

  // Variáveis estáticas para armazenar dados da repetição
  if (!(analyzeSquat as any)._repData) {
    (analyzeSquat as any)._repData = {
      angles: [],
      timestamps: [],
      lastDirection: null,
      lastAngle: null,
      upStartTime: null,
      downStartTime: null,
      upAngles: [],
      downAngles: [],
    };
  }
  const repData = (analyzeSquat as any)._repData;

  if (kneeAngle !== null) {
    const now = Date.now();
    repData.angles.push(kneeAngle);
    repData.timestamps.push(now);
    // Detectar direção do movimento (subida ou descida)
    let direction: 'up' | 'down' | null = null;
    if (repData.lastAngle !== null) {
      if (kneeAngle < repData.lastAngle) direction = 'down'; // descendo (agachando)
      else if (kneeAngle > repData.lastAngle) direction = 'up'; // subindo
    }
    repData.lastAngle = kneeAngle;
    // Marcar início de subida/descida
    if (direction === 'down' && repData.lastDirection !== 'down') {
      repData.downStartTime = now;
      repData.downAngles = [];
    }
    if (direction === 'up' && repData.lastDirection !== 'up') {
      repData.upStartTime = now;
      repData.upAngles = [];
    }
    if (direction === 'down') repData.downAngles.push({ angle: kneeAngle, time: now });
    if (direction === 'up') repData.upAngles.push({ angle: kneeAngle, time: now });
    repData.lastDirection = direction;
    // Se estava em pé e desceu (agachou)
    if (!isDown && kneeAngle < downThreshold) {
      setIsDown(true);
      setSquatDetected(true);
    }
    // Se estava agachado e voltou a ficar em pé, conta repetição
    if (isDown && kneeAngle > upThreshold && now - lastRepCountTimeRef.current > minInterval) {
      setIsDown(false);
      setSquatDetected(false);
      // Calcular métricas da repetição
      const minAngle = Math.min(...repData.angles);
      const maxAngle = Math.max(...repData.angles);
      const executionTime = (repData.timestamps[repData.timestamps.length - 1] - repData.timestamps[0]) / 1000;
      const amplitude = Math.abs(maxAngle - minAngle);
      // Velocidade média de descida
      let downVelocity = 0;
      if (repData.downAngles.length > 1 && repData.downStartTime) {
        const downTime = (repData.downAngles[repData.downAngles.length - 1].time - repData.downStartTime) / 1000;
        const downAmp = Math.abs(repData.downAngles[0].angle - repData.downAngles[repData.downAngles.length - 1].angle);
        downVelocity = downAmp / (downTime || 1);
      }
      // Velocidade média de subida
      let upVelocity = 0;
      if (repData.upAngles.length > 1 && repData.upStartTime) {
        const upTime = (repData.upAngles[repData.upAngles.length - 1].time - repData.upStartTime) / 1000;
        const upAmp = Math.abs(repData.upAngles[0].angle - repData.upAngles[repData.upAngles.length - 1].angle);
        upVelocity = upAmp / (upTime || 1);
      }
      // Enviar para callback
      if (onRepIndicatorExtracted) {
        onRepIndicatorExtracted({
          minAngle,
          maxAngle,
          executionTime,
          amplitude,
          upVelocity,
          downVelocity,
        });
      }
      // Limpar dados para próxima repetição
      repData.angles = [];
      repData.timestamps = [];
      repData.upAngles = [];
      repData.downAngles = [];
      repData.upStartTime = null;
      repData.downStartTime = null;
      repData.lastDirection = null;
      repData.lastAngle = null;
      onRepetitionCount('good');
      lastRepCountTimeRef.current = now;
    }
  } else {
    // More detailed feedback when there's poor detection
    console.log("⚠️ Insufficient visibility of key points");
    const visibilityDetails = {
      leftHip: leftHip?.score?.toFixed(2) || "not detected",
      leftKnee: leftKnee?.score?.toFixed(2) || "not detected",
      leftAnkle: leftAnkle?.score?.toFixed(2) || "not detected",
      rightHip: rightHip?.score?.toFixed(2) || "not detected",
      rightKnee: rightKnee?.score?.toFixed(2) || "not detected",
      rightAnkle: rightAnkle?.score?.toFixed(2) || "not detected"
    };
    console.log("Visibility details:", visibilityDetails);
    
    // Only provide feedback if quality has been poor for several frames
    if (detectionQuality === 'poor' && frameCountRef.current % 30 === 0) {
      updateFeedbackWithDebounce('Afaste-se um pouco da câmera para que eu possa ver suas pernas completamente.', 5000);
    }
    frameCountRef.current += 1;
  }
};

// Helper function to calculate angle between three points
const calculateAngle = (a: Keypoint, b: Keypoint, c: Keypoint) => {
  if (!a || !b || !c) return 180;
  
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - 
                  Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
};
