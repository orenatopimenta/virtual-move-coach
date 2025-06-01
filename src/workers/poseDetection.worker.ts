import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

let detector: poseDetection.PoseDetector | null = null;
let frameCount = 0;
const FRAME_SKIP = 2; // Process every 3rd frame

// Initialize the model
async function initializeModel() {
  try {
    await tf.setBackend('webgl');
    await tf.ready();
    
    const model = poseDetection.SupportedModels.MoveNet;
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    };
    
    detector = await poseDetection.createDetector(model, detectorConfig);
    return true;
  } catch (error) {
    console.error('Error initializing model in worker:', error);
    return false;
  }
}

// Handle messages from the main thread
self.onmessage = async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'INIT':
      const success = await initializeModel();
      self.postMessage({ type: 'INIT_COMPLETE', success });
      break;

    case 'DETECT':
      if (!detector) {
        self.postMessage({ type: 'ERROR', error: 'Detector not initialized' });
        return;
      }

      // Skip frames for better performance
      frameCount++;
      if (frameCount % (FRAME_SKIP + 1) !== 0) {
        return;
      }

      try {
        // Create a tensor from the image data for better performance
        const imageTensor = tf.browser.fromPixels(data.imageData);
        
        // Run pose detection
        const poses = await detector.estimatePoses(imageTensor);
        
        // Clean up tensor to prevent memory leaks
        imageTensor.dispose();
        
        self.postMessage({ type: 'DETECTION_RESULT', poses });
      } catch (error) {
        console.error('Detection error:', error);
        self.postMessage({ type: 'ERROR', error: 'Detection failed' });
      }
      break;

    case 'CLEANUP':
      if (detector) {
        detector.dispose();
        detector = null;
      }
      // Clean up any remaining tensors
      tf.disposeVariables();
      self.postMessage({ type: 'CLEANUP_COMPLETE' });
      break;
  }
}; 