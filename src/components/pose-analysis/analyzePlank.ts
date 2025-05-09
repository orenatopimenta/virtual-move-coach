
import { Keypoint } from '@tensorflow-models/pose-detection';
import { calculateAngle } from './utils';

/**
 * Analyzes plank form using pose detection
 */
export const analyzePlank = (
  keypoints: Keypoint[],
  isHolding: boolean,
  setIsHolding: React.Dispatch<React.SetStateAction<boolean>>,
  lastRepCountTimeRef: React.MutableRefObject<number>,
  setExecutionQuality: React.Dispatch<React.SetStateAction<'good' | 'average' | 'poor' | null>>,
  onRepetitionCount: (quality: 'good' | 'average' | 'poor') => void,
  updateFeedbackWithDebounce: (message: string, minInterval: number) => void,
  onFeedback: (message: string) => void
) => {
  // Create a dictionary of keypoints for easier access
  const keypointDict: {[key: string]: Keypoint} = {};
  keypoints.forEach(keypoint => {
    keypointDict[keypoint.name as string] = keypoint;
  });

  const leftShoulder = keypointDict['left_shoulder'];
  const leftHip = keypointDict['left_hip'];
  const leftKnee = keypointDict['left_knee'];
  const leftAnkle = keypointDict['left_ankle'];

  // For plank, we need visible shoulders, hips, and knees
  if (leftShoulder?.score > 0.3 && leftHip?.score > 0.3 && leftKnee?.score > 0.3) {
    // Check body alignment for plank position
    // For a plank, we want the body to form a straight line from shoulders through hips to ankles
    
    // First check shoulder-hip-knee alignment
    const hipToShoulderAngle = calculateAngle(leftKnee, leftHip, leftShoulder);
    
    // Log information for debugging
    console.log(`PLANK ANALYSIS - Hip to shoulder angle: ${hipToShoulderAngle.toFixed(1)}°, isHolding: ${isHolding}`);
    
    // For a good plank, we want this angle close to 180 degrees (straight line)
    const isGoodAlignment = hipToShoulderAngle > 160;
    const isAcceptableAlignment = hipToShoulderAngle > 140;
    
    // Check if person is in plank position
    if (!isHolding && (isGoodAlignment || isAcceptableAlignment)) {
      console.log(`🔍 DETECTED: Plank position - Alignment angle: ${hipToShoulderAngle.toFixed(1)}°`);
      
      setIsHolding(true);
      
      // Determine quality based on alignment
      if (isGoodAlignment) {
        setExecutionQuality('good');
        updateFeedbackWithDebounce('Excelente alinhamento na prancha!', 2000);
      } else {
        setExecutionQuality('average');
        updateFeedbackWithDebounce('Boa prancha, tente manter o corpo em linha reta.', 2000);
      }
      
      // Start counting hold time
      const now = Date.now();
      lastRepCountTimeRef.current = now;
      
    } 
    // If already in plank, check if still holding position
    else if (isHolding) {
      // Check if still in plank position
      if (!isAcceptableAlignment) {
        console.log(`🟢 PLANK POSITION ENDED - Held for ${(Date.now() - lastRepCountTimeRef.current) / 1000} seconds`);
        setIsHolding(false);
        
        // Determine quality based on hold time
        const holdTime = Date.now() - lastRepCountTimeRef.current;
        let quality: 'good' | 'average' | 'poor' = 'poor';
        
        if (holdTime > 20000) { // 20+ seconds
          quality = 'good';
          updateFeedbackWithDebounce('Excelente! Prancha mantida por tempo ideal.', 1000);
        } else if (holdTime > 10000) { // 10-20 seconds
          quality = 'average';
          updateFeedbackWithDebounce('Bom! Continue aumentando o tempo de prancha.', 1000);
        } else {
          updateFeedbackWithDebounce('Tente manter a prancha por mais tempo.', 1000);
        }
        
        onRepetitionCount(quality);
        setExecutionQuality(null);
      } 
      // Still holding, provide periodic feedback on the hold time
      else {
        const holdTime = Date.now() - lastRepCountTimeRef.current;
        
        if (holdTime > 5000 && holdTime % 5000 < 100) { // Every 5 seconds
          const seconds = Math.floor(holdTime / 1000);
          updateFeedbackWithDebounce(`Continue! ${seconds} segundos de prancha.`, 1000);
          
          // Update quality as they hold longer
          if (seconds > 20 && isGoodAlignment) {
            setExecutionQuality('good');
          } else if (seconds > 10) {
            setExecutionQuality('average');
          }
        }
      }
    }
  } else {
    // Give feedback about poor visibility if needed
    if (Math.random() < 0.02) { // Limit feedback frequency
      updateFeedbackWithDebounce('Posicione a câmera de lado para capturar seu perfil durante a prancha.', 5000);
    }
  }
};
