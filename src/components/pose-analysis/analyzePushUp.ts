
import { Keypoint } from '@tensorflow-models/pose-detection';
import { calculateAngle } from './utils';

/**
 * Analyzes push-up form using pose detection
 */
export const analyzePushUp = (
  keypoints: Keypoint[],
  isDown: boolean, 
  setIsDown: React.Dispatch<React.SetStateAction<boolean>>,
  lastRepCountTimeRef: React.MutableRefObject<number>,
  setExecutionQuality: React.Dispatch<React.SetStateAction<'good' | 'average' | 'poor' | null>>,
  onRepetitionCount: (quality: 'good' | 'average' | 'poor') => void,
  updateFeedbackWithDebounce: (message: string, minInterval: number) => void,
  onFeedback: (message: string) => void,
  checkAlignment: (keypoints: {[key: string]: Keypoint}) => boolean
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
  if (leftShoulder?.score > 0.5 && leftElbow?.score > 0.5 && leftWrist?.score > 0.5 &&
      rightShoulder?.score > 0.5 && rightElbow?.score > 0.5 && rightWrist?.score > 0.5) {
    
    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    
    // Average of both elbow angles for better detection
    const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
    
    // Log information for debugging
    console.log(`PUSHUP ANALYSIS - Elbow angle: ${elbowAngle.toFixed(1)}°, isDown: ${isDown}`);
    
    // Check if arms are bent (push-up down position)
    if (elbowAngle < 110 && !isDown) {
      console.log(`🔍 DETECTED: Push-up down position - Angle: ${elbowAngle.toFixed(1)}°`);
      setIsDown(true);
      
      // Check body alignment
      const isAligned = checkPushupAlignment(keypointDict);
      
      if (elbowAngle < 90 && isAligned) {
        setExecutionQuality('good');
        updateFeedbackWithDebounce('Excelente posição! Corpo bem alinhado.', 1000);
      } else if (elbowAngle < 100) {
        setExecutionQuality('average');
        updateFeedbackWithDebounce('Boa flexão, mantenha o corpo alinhado.', 1000);
      } else {
        setExecutionQuality('poor');
        updateFeedbackWithDebounce('Tente dobrar mais os cotovelos e manter o corpo reto.', 1000);
      }
    } 
    // Check if arms are straight (push-up up position)
    else if (elbowAngle > 160 && isDown) {
      console.log(`🟢 PUSHUP REP COMPLETED! Angle: ${elbowAngle.toFixed(1)}°`);
      setIsDown(false);
      
      // Ensure enough time has passed since last rep count to avoid duplicates
      const now = Date.now();
      if (now - lastRepCountTimeRef.current > 500) {
        lastRepCountTimeRef.current = now;
        
        // Determine rep quality based on alignment and depth
        const isAligned = checkPushupAlignment(keypointDict);
        let repQuality: 'good' | 'average' | 'poor' = isAligned ? 'good' : 'average';
        
        onRepetitionCount(repQuality);
        updateFeedbackWithDebounce('Boa! Repetição contabilizada.', 1000);
        setExecutionQuality(null);
      }
    }
  } else {
    // Give feedback about poor visibility
    if (Math.random() < 0.02) { // Limit feedback frequency
      updateFeedbackWithDebounce('Ajuste a câmera para que seus braços e ombros sejam visíveis.', 5000);
    }
  }
};

/**
 * Check if the body is properly aligned during a push-up
 */
export const checkPushupAlignment = (keypoints: {[key: string]: Keypoint}) => {
  const nose = keypoints['nose'];
  const leftShoulder = keypoints['left_shoulder'];
  const rightShoulder = keypoints['right_shoulder'];
  const leftHip = keypoints['left_hip'];
  const rightHip = keypoints['right_hip'];
  
  // If we don't have all the necessary keypoints, we can't check alignment
  if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return true;  // Default to true if we can't verify
  }
  
  // Calculate midpoints
  const midShoulder = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  
  const midHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  
  // Check if body (shoulder to hip) is horizontal
  // In camera view, Y increases downward, so we want Y values to be similar
  const verticalDiff = Math.abs(midShoulder.y - midHip.y);
  const horizontalDistance = Math.abs(midShoulder.x - midHip.x);
  
  // Allow for some tilt, but not too much
  // A perfect horizontal line would have verticalDiff = 0
  return (verticalDiff / horizontalDistance) < 0.3;
};
