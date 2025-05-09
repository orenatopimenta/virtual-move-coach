
import { Keypoint } from '@tensorflow-models/pose-detection';

/**
 * Calculate the angle between three points
 * @param a First point
 * @param b Middle point (the vertex)
 * @param c Third point
 * @returns Angle in degrees
 */
export const calculateAngle = (a: Keypoint, b: Keypoint, c: Keypoint) => {
  if (!a || !b || !c) return 180;
  
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - 
                  Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
};

/**
 * Calculate distance between two points
 * @param a First point
 * @param b Second point
 * @returns Distance
 */
export const calculateDistance = (a: Keypoint, b: Keypoint) => {
  if (!a || !b) return 0;
  
  return Math.sqrt(
    Math.pow(b.x - a.x, 2) + 
    Math.pow(b.y - a.y, 2)
  );
};

/**
 * Smooth values over time to reduce jitter
 * @param values Array of previous values
 * @param newValue New value to add
 * @param maxLength Maximum length of history to maintain
 * @returns Smoothed value (average of values)
 */
export const smoothValue = (values: number[], newValue: number, maxLength: number = 5) => {
  // Add new value to array
  values.push(newValue);
  
  // Trim array if needed
  if (values.length > maxLength) {
    values.shift();
  }
  
  // Calculate average
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Check if a pose is visible enough to analyze
 * @param keypoints Dictionary of keypoints
 * @param requiredPoints Array of required keypoint names
 * @param minConfidence Minimum confidence score required
 * @returns Boolean indicating if pose is visible enough
 */
export const isPoseVisible = (
  keypoints: {[key: string]: Keypoint},
  requiredPoints: string[],
  minConfidence: number = 0.3
) => {
  for (const point of requiredPoints) {
    const keypoint = keypoints[point];
    if (!keypoint || !keypoint.score || keypoint.score < minConfidence) {
      return false;
    }
  }
  return true;
};
