import { Keypoint } from '@tensorflow-models/pose-detection';
import { calculateAngle } from './utils';

/**
 * Analyzes biceps curl form using pose detection
 */
export const analyzeBicepsCurl = (
  keypoints: Keypoint[],
  isDown: boolean, 
  setIsDown: React.Dispatch<React.SetStateAction<boolean>>,
  lastRepCountTimeRef: React.MutableRefObject<number>,
  setExecutionQuality: React.Dispatch<React.SetStateAction<'good' | 'average' | 'poor' | null>>,
  onRepetitionCount: (quality: 'good' | 'average' | 'poor') => void,
  updateFeedbackWithDebounce: (message: string, minInterval: number) => void,
  onFeedback: (message: string) => void,
  checkStability: (prevKeypoints: Keypoint[], currentKeypoints: {[key: string]: Keypoint}) => boolean,
  onRepIndicatorExtracted?: (indicator: any) => void
) => {
  // Create a dictionary of keypoints for easier access
  const keypointDict: {[key: string]: Keypoint} = {};
  keypoints.forEach(keypoint => {
    keypointDict[keypoint.name as string] = keypoint;
  });

  const leftShoulder = keypointDict['left_shoulder'];
  const leftElbow = keypointDict['left_elbow'];
  const leftWrist = keypointDict['left_wrist'];
  const rightShoulder = keypointDict['right_shoulder'];
  const rightElbow = keypointDict['right_elbow'];
  const rightWrist = keypointDict['right_wrist'];
  
  // Check if we have the essential keypoints with good enough confidence
  if (leftShoulder?.score > 0.5 && leftElbow?.score > 0.5 && leftWrist?.score > 0.5) {
    
    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    
    // Try right arm if available
    let rightElbowAngle = 180;
    if (rightShoulder?.score > 0.5 && rightElbow?.score > 0.5 && rightWrist?.score > 0.5) {
      rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    }
    
    // Use the most bent arm for detection
    const elbowAngle = Math.min(leftElbowAngle, rightElbowAngle);
    
    // Log information for debugging
    console.log(`BICEPS CURL ANALYSIS - Elbow angle: ${elbowAngle.toFixed(1)}°, isDown: ${isDown}`);
    
    // Variáveis estáticas para armazenar dados da repetição
    // (usando propriedades do próprio analyzeBicepsCurl para manter estado entre execuções)
    if (!(analyzeBicepsCurl as any)._repData) {
      (analyzeBicepsCurl as any)._repData = {
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
    const repData = (analyzeBicepsCurl as any)._repData;

    // Armazene o ângulo e timestamp para análise da repetição
    const now = Date.now();
    repData.angles.push(elbowAngle);
    repData.timestamps.push(now);

    // Detectar direção do movimento (subida ou descida)
    let direction: 'up' | 'down' | null = null;
    if (repData.lastAngle !== null) {
      if (elbowAngle < repData.lastAngle) direction = 'up';
      else if (elbowAngle > repData.lastAngle) direction = 'down';
    }
    repData.lastAngle = elbowAngle;

    // Marcar início de subida/descida
    if (direction === 'up' && repData.lastDirection !== 'up') {
      repData.upStartTime = now;
      repData.upAngles = [];
    }
    if (direction === 'down' && repData.lastDirection !== 'down') {
      repData.downStartTime = now;
      repData.downAngles = [];
    }
    if (direction === 'up') repData.upAngles.push({ angle: elbowAngle, time: now });
    if (direction === 'down') repData.downAngles.push({ angle: elbowAngle, time: now });
    repData.lastDirection = direction;

    // Check if arm is bent (curl up position)
    if (elbowAngle < 80 && !isDown) {
      console.log(`🔍 DETECTED: Curl up position - Angle: ${elbowAngle.toFixed(1)}°`);
      setIsDown(true);
      
      // Check elbow stability (not moving forward) if we have previous data
      const isStable = isElbowStable([leftElbow], keypointDict);
      
      if (elbowAngle < 50 && isStable) {
        setExecutionQuality('good');
        updateFeedbackWithDebounce('Excelente contração! Cotovelo estável.', 1000);
      } else if (elbowAngle < 70) {
        setExecutionQuality('average');
        updateFeedbackWithDebounce('Boa rosca, mantenha o cotovelo na mesma posição.', 1000);
      } else {
        setExecutionQuality('poor');
        updateFeedbackWithDebounce('Tente dobrar mais o cotovelo e mantê-lo firme.', 1000);
      }
    } 
    // Check if arm is straight (curl down position)
    else if (elbowAngle > 160 && isDown) {
      console.log(`🟢 CURL REP COMPLETED! Angle: ${elbowAngle.toFixed(1)}°`);
      setIsDown(false);
      
      // Ensure enough time has passed since last rep count to avoid duplicates
      if (now - lastRepCountTimeRef.current > 500) {
        lastRepCountTimeRef.current = now;
        
        // Calcular métricas da repetição
        const minAngle = Math.min(...repData.angles);
        const maxAngle = Math.max(...repData.angles);
        const executionTime = (repData.timestamps[repData.timestamps.length - 1] - repData.timestamps[0]) / 1000;
        const amplitude = Math.abs(maxAngle - minAngle);
        // Velocidade média de subida
        let upVelocity = 0;
        if (repData.upAngles.length > 1 && repData.upStartTime) {
          const upTime = (repData.upAngles[repData.upAngles.length - 1].time - repData.upStartTime) / 1000;
          const upAmp = Math.abs(repData.upAngles[0].angle - repData.upAngles[repData.upAngles.length - 1].angle);
          upVelocity = upAmp / (upTime || 1);
        }
        // Velocidade média de descida
        let downVelocity = 0;
        if (repData.downAngles.length > 1 && repData.downStartTime) {
          const downTime = (repData.downAngles[repData.downAngles.length - 1].time - repData.downStartTime) / 1000;
          const downAmp = Math.abs(repData.downAngles[0].angle - repData.downAngles[repData.downAngles.length - 1].angle);
          downVelocity = downAmp / (downTime || 1);
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
        
        // Determine quality based on minimum angle and stability
        // Using average quality as default
        onRepetitionCount('average');
        updateFeedbackWithDebounce('Boa! Repetição contabilizada.', 1000);
        setExecutionQuality(null);
      }
    }
  } else {
    // Give feedback about poor visibility
    if (Math.random() < 0.02) { // Limit feedback frequency
      updateFeedbackWithDebounce('Ajuste a câmera para que seus braços sejam visíveis.', 5000);
    }
  }
};

/**
 * Check if the elbow position is stable (not moving forward)
 */
export const isElbowStable = (previousElbows: Keypoint[], currentKeypoints: {[key: string]: Keypoint}) => {
  // If we don't have previous data, assume it's stable
  if (!previousElbows || previousElbows.length === 0) return true;
  
  const currentLeftElbow = currentKeypoints['left_elbow'];
  const currentRightElbow = currentKeypoints['right_elbow'];
  
  // If we don't have current elbows, can't check stability
  if (!currentLeftElbow && !currentRightElbow) return true;
  
  let isStable = true;
  
  // Check left elbow stability if available
  if (currentLeftElbow && previousElbows.some(e => e.name === 'left_elbow')) {
    const prevLeftElbow = previousElbows.find(e => e.name === 'left_elbow');
    if (prevLeftElbow) {
      // If elbow x position moved significantly, it's not stable
      // Consider horizontal movement more than 15px as unstable
      isStable = isStable && (Math.abs(currentLeftElbow.x - prevLeftElbow.x) < 15);
    }
  }
  
  // Check right elbow stability if available
  if (currentRightElbow && previousElbows.some(e => e.name === 'right_elbow')) {
    const prevRightElbow = previousElbows.find(e => e.name === 'right_elbow');
    if (prevRightElbow) {
      isStable = isStable && (Math.abs(currentRightElbow.x - prevRightElbow.x) < 15);
    }
  }
  
  return isStable;
};
