import { Keypoint } from '@tensorflow-models/pose-detection';

export interface ExerciseConfig {
  name: string;
  requiredKeypoints: string[];
  positioningInstructions: string;
  detectionMessage: string;
  thresholds: {
    good: number;
    average: number;
  };
  animationUrl: string;
}

// Configuration for each supported exercise
export const exerciseConfigs: Record<string, ExerciseConfig> = {
  squat: {
    name: 'Agachamento',
    requiredKeypoints: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle'],
    positioningInstructions: 'Afaste-se para a câmera ver suas pernas completas',
    detectionMessage: 'AGACHAMENTO DETECTADO!',
    thresholds: {
      good: 90, // Angle in degrees
      average: 110,
    },
    animationUrl: '/animations/squat-animation.gif',
  },
  lunge: {
    name: 'Avanço',
    requiredKeypoints: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle'],
    positioningInstructions: 'Afaste-se para a câmera ver suas pernas completas',
    detectionMessage: 'AVANÇO DETECTADO!',
    thresholds: {
      good: 90,
      average: 110,
    },
    animationUrl: '/animations/lunge-animation.gif',
  },
  pushup: {
    name: 'Flexão',
    requiredKeypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
    positioningInstructions: 'Posicione a câmera para ver seu tronco e braços completos',
    detectionMessage: 'FLEXÃO DETECTADA!',
    thresholds: {
      good: 90,
      average: 110,
    },
    animationUrl: '/animations/pushup-animation.gif',
  },
  curl: {
    name: 'Rosca Bíceps',
    requiredKeypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
    positioningInstructions: 'Posicione-se para que seus braços estejam visíveis',
    detectionMessage: 'CONTRAÇÃO DETECTADA!',
    thresholds: {
      good: 50,
      average: 70,
    },
    animationUrl: '/animations/curl-animation.gif',
  },
  plank: {
    name: 'Prancha',
    requiredKeypoints: ['left_shoulder', 'left_hip', 'left_knee', 'left_ankle', 'right_shoulder', 'right_hip'],
    positioningInstructions: 'Posicione a câmera lateralmente para ver seu corpo na horizontal',
    detectionMessage: 'PRANCHA DETECTADA!',
    thresholds: {
      good: 170, // Body alignment angle (nearly straight)
      average: 160,
    },
    animationUrl: '/animations/plank-animation.gif',
  },
  // Adding aliases for exercise names with spaces/accents
  agachamento: {
    name: 'Agachamento',
    requiredKeypoints: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle'],
    positioningInstructions: 'Afaste-se para a câmera ver suas pernas completas',
    detectionMessage: 'AGACHAMENTO DETECTADO!',
    thresholds: {
      good: 90,
      average: 110,
    },
    animationUrl: '/animations/squat-animation.gif',
  },
  avanço: {
    name: 'Avanço',
    requiredKeypoints: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle'],
    positioningInstructions: 'Afaste-se para a câmera ver suas pernas completas',
    detectionMessage: 'AVANÇO DETECTADO!',
    thresholds: {
      good: 90,
      average: 110,
    },
    animationUrl: '/animations/lunge-animation.gif',
  },
  flexão: {
    name: 'Flexão',
    requiredKeypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
    positioningInstructions: 'Posicione a câmera para ver seu tronco e braços completos',
    detectionMessage: 'FLEXÃO DETECTADA!',
    thresholds: {
      good: 90,
      average: 110,
    },
    animationUrl: '/animations/pushup-animation.gif',
  },
  roscabíceps: {
    name: 'Rosca Bíceps',
    requiredKeypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
    positioningInstructions: 'Posicione-se para que seus braços estejam visíveis',
    detectionMessage: 'CONTRAÇÃO DETECTADA!',
    thresholds: {
      good: 50,
      average: 70,
    },
    animationUrl: '/animations/curl-animation.gif',
  },
  prancha: {
    name: 'Prancha',
    requiredKeypoints: ['left_shoulder', 'left_hip', 'left_knee', 'left_ankle', 'right_shoulder', 'right_hip'],
    positioningInstructions: 'Posicione a câmera lateralmente para ver seu corpo na horizontal',
    detectionMessage: 'PRANCHA DETECTADA!',
    thresholds: {
      good: 170,
      average: 160,
    },
    animationUrl: '/animations/plank-animation.gif',
  },
  'levantamento-lateral': {
    name: 'Levantamento Lateral',
    requiredKeypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
    positioningInstructions: 'Posicione-se de lado para a câmera ver seus ombros e braços',
    detectionMessage: 'LEVANTAMENTO LATERAL DETECTADO!',
    thresholds: {
      good: 80, // ângulo do braço em relação ao tronco
      average: 100,
    },
    animationUrl: '/animations/lateral-raise.gif',
  },
  'levantamento-frontal': {
    name: 'Levantamento Frontal',
    requiredKeypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
    positioningInstructions: 'Posicione-se de lado para a câmera ver seus ombros e braços',
    detectionMessage: 'LEVANTAMENTO FRONTAL DETECTADO!',
    thresholds: {
      good: 80,
      average: 100,
    },
    animationUrl: '/animations/front-raise.gif',
  },
  'desenvolvimento': {
    name: 'Desenvolvimento',
    requiredKeypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
    positioningInstructions: 'Posicione-se de frente para a câmera, braços acima da cabeça',
    detectionMessage: 'DESENVOLVIMENTO DETECTADO!',
    thresholds: {
      good: 60,
      average: 90,
    },
    animationUrl: '/animations/shoulder-press.gif',
  },
};

// Get configuration for a specific exercise
export const getExerciseConfig = (exerciseId: string): ExerciseConfig => {
  // Convert to lowercase and remove spaces/accents for more consistent lookup
  const normalizedId = exerciseId.toLowerCase().replace(/\s+/g, '');
  
  // Return the config for the normalized ID or default to squat
  return exerciseConfigs[normalizedId] || exerciseConfigs.squat;
};

// Check if keypoints for specific exercise are visible
export const checkExerciseVisibility = (
  keypoints: {[key: string]: Keypoint}, 
  exercise: string,
  minConfidence: number = 0.3
): boolean => {
  const config = getExerciseConfig(exercise);
  
  for (const point of config.requiredKeypoints) {
    const keypoint = keypoints[point];
    if (!keypoint || !keypoint.score || keypoint.score < minConfidence) {
      return false;
    }
  }
  return true;
};
