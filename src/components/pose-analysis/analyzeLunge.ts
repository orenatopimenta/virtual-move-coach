
import { Keypoint } from '@tensorflow-models/pose-detection';
import { calculateAngle } from './utils';

/**
 * Analyzes lunge form using pose detection
 */
export const analyzeLunge = (
  keypoints: Keypoint[],
  isDown: boolean, 
  setIsDown: React.Dispatch<React.SetStateAction<boolean>>,
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

  const leftHip = keypointDict['left_hip'];
  const leftKnee = keypointDict['left_knee'];
  const leftAnkle = keypointDict['left_ankle'];
  const rightHip = keypointDict['right_hip'];
  const rightKnee = keypointDict['right_knee'];
  const rightAnkle = keypointDict['right_ankle'];
  
  // Check if we have the essential keypoints with good enough confidence
  if (leftHip?.score > 0.3 && leftKnee?.score > 0.3 && leftAnkle?.score > 0.3 &&
      rightHip?.score > 0.3 && rightKnee?.score > 0.3 && rightAnkle?.score > 0.3) {
      
    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    
    // Log information for debugging
    console.log(`LUNGE ANALYSIS - Left angle: ${leftKneeAngle.toFixed(1)}°, Right angle: ${rightKneeAngle.toFixed(1)}°, isDown: ${isDown}`);
    
    // Check stance distance to determine if it's a lunge position
    // For a lunge, feet should be separated (one forward, one back)
    const feetDistance = Math.abs(leftAnkle.x - rightAnkle.x);
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    const isLungeStance = feetDistance > hipWidth * 1.5;
    
    // Detect lunge down position (front knee bent, back leg extended)
    // We'll check if one knee is significantly more bent than the other
    const kneeAngleDifference = Math.abs(leftKneeAngle - rightKneeAngle);
    
    // Detect lunge down position
    if (!isDown && isLungeStance && kneeAngleDifference > 30 && 
        (leftKneeAngle < 110 || rightKneeAngle < 110)) {
      
      console.log(`🔍 DETECTED: Lunge position - Knee angle diff: ${kneeAngleDifference.toFixed(1)}°`);
      
      setIsDown(true);
      
      // Determine quality based on front knee angle and alignment
      const frontKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);
      
      if (frontKneeAngle < 90) {
        setExecutionQuality('good');
        updateFeedbackWithDebounce('Excelente profundidade no avanço!', 1000);
      } else if (frontKneeAngle < 110) {
        setExecutionQuality('average');
        updateFeedbackWithDebounce('Bom avanço, tente descer um pouco mais.', 1000);
      } else {
        setExecutionQuality('poor');
        updateFeedbackWithDebounce('Avanço detectado. Tente dobrar mais o joelho da frente.', 1000);
      }
    }
    // Detect return to standing position
    else if (isDown && (!isLungeStance || (leftKneeAngle > 160 && rightKneeAngle > 160))) {
      console.log(`🟢 LUNGE REP COMPLETED!`);
      setIsDown(false);
      
      // Ensure enough time has passed since last rep count to avoid duplicates
      const now = Date.now();
      if (now - lastRepCountTimeRef.current > 500) {
        lastRepCountTimeRef.current = now;
        
        // We could determine quality based on the minimum angles and stance
        // Using average quality for now
        onRepetitionCount('average');
        updateFeedbackWithDebounce('Boa! Repetição contabilizada.', 1000);
        setExecutionQuality(null);
      }
    }
  } else {
    // Give feedback about poor visibility
    if (Math.random() < 0.02) { // Limit feedback frequency
      updateFeedbackWithDebounce('Ajuste sua posição para que a câmera possa ver suas pernas.', 5000);
    }
  }
};
