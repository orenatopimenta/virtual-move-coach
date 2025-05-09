
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
  updateFeedbackWithDebounce: (message: string, minInterval: number) => void
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
  
  // Try to analyze even with poor visibility - MUCH MORE PERMISSIVE
  if (leftHip && leftKnee && leftAnkle && leftHip.score && leftKnee.score && leftAnkle.score) {
    // Calculate knee angles - use only left side if necessary
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    let kneeAngle = leftKneeAngle;
    
    // If right side is also visible, calculate average
    if (rightHip && rightKnee && rightAnkle && 
        rightHip.score && rightKnee.score && rightAnkle.score &&
        rightHip.score > 0.1 && rightKnee.score > 0.1 && rightAnkle.score > 0.1) {
      const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    }
    
    // Detailed log for analysis
    console.log(`SQUAT ANALYSIS - Current angle: ${kneeAngle.toFixed(1)}°, isDown: ${isDown}, squatDetected: ${squatDetected}`);
    
    // HIGHLY SENSITIVE - detect any significant knee bend
    // Squat position detection - much more sensitive (angle up to 145°)
    if (kneeAngle < 145 && !isDown) {
      // Immediate visual update
      setSquatDetected(true);
      
      console.log(`🔍 DETECTED: Possible squat initiated - Angle: ${kneeAngle.toFixed(1)}°`);
      
      // MUCH MORE REACTIVE: No need to confirm with additional frames
      console.log(`🔴 LOW POSITION IMMEDIATELY CONFIRMED! Angle: ${kneeAngle.toFixed(1)}°`);
      setIsDown(true);
      frameCountRef.current = 0;
      
      // Determine execution quality based on angle
      if (kneeAngle < 110) {
        setExecutionQuality('good');
        updateFeedbackWithDebounce('Excelente profundidade no agachamento!', 1000);
      } else if (kneeAngle < 130) {
        setExecutionQuality('average');
        updateFeedbackWithDebounce('Bom agachamento, tente descer um pouco mais.', 1000);
      } else {
        setExecutionQuality('poor');
        updateFeedbackWithDebounce('Agachamento detectado! Tente descer mais.', 1000);
      }
    } 
    // Standing position detection - much more sensitive
    else if (kneeAngle > 160 && isDown) {
      console.log(`🟢 REP IMMEDIATELY COMPLETED! Angle: ${kneeAngle.toFixed(1)}°`);
      setIsDown(false);
      setSquatDetected(false);
      frameCountRef.current = 0;
      
      // Ensure enough time has passed since last rep count to avoid duplicates
      const now = Date.now();
      if (now - lastRepCountTimeRef.current > 500) {
        lastRepCountTimeRef.current = now;
        
        // Determine rep quality based on minimum angle achieved during the rep
        // Here we're just using a simple heuristic, could be improved with more data
        let repQuality: 'good' | 'average' | 'poor' = 'average';
        
        // Count the repetition
        onRepetitionCount(repQuality);
        updateFeedbackWithDebounce('Boa! Repetição contabilizada.', 1000);
        setExecutionQuality(null);
        
        console.log("🎯 Calling repetition callback - counting squat rep");
      }
    }
    // If in the middle of a squat, maintain visual state
    else if (kneeAngle < 150) {
      setSquatDetected(true);
    }
    // If knee is almost straight, reset visual
    else if (kneeAngle > 165) {
      setSquatDetected(false);
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
