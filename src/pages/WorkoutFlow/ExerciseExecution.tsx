
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Timer, StopCircle } from 'lucide-react';
import EnhancedPoseDetection from '@/components/EnhancedPoseDetection';
import ExerciseAnimation from '@/components/ExerciseAnimation';
import WorkoutDashboard from '@/components/WorkoutDashboard';

interface ExerciseData {
  id: string;
  name: string;
  muscles: string;
}

type ExerciseStage = 'intro' | 'setup' | 'active' | 'rest' | 'complete';

interface RepStats {
  total: number;
  good: number;
  average: number;
  poor: number;
}

const ExerciseExecution: React.FC = () => {
  const { exerciseId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [exercise, setExercise] = useState<ExerciseData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState<ExerciseStage>('intro'); // Starting with intro stage for animation
  const [repetitions, setRepetitions] = useState(0);
  const [series, setSeries] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTime, setRestTime] = useState(120); // 2 minutes rest
  const [showCompletionFlash, setShowCompletionFlash] = useState(false);
  const [repStats, setRepStats] = useState<RepStats>({ total: 0, good: 0, average: 0, poor: 0 });
  const [feedbackType, setFeedbackType] = useState<'good' | 'average' | 'poor' | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Progress bar for repetitions
  const repProgress = (repetitions / 12) * 100;
  
  // Timer refs
  const timerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  
  // Load exercise data and progress
  useEffect(() => {
    const exerciseData = localStorage.getItem("currentExercise");
    if (exerciseData) {
      setExercise(JSON.parse(exerciseData));
    } else {
      // Fallback to URL parameter
      // In a real app, you'd fetch the exercise data from an API
      setExercise({
        id: exerciseId,
        name: "Exercício",
        muscles: ""
      });
    }
    
    return () => {
      // Clear timers when component unmounts
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (restTimerRef.current) window.clearInterval(restTimerRef.current);
    };
  }, [exerciseId]);
  
  // Handle intro animation completion
  const handleIntroComplete = () => {
    setStage('setup');
  };
  
  // Start time tracking when analysis begins
  useEffect(() => {
    if (isAnalyzing && stage === 'active') {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (!isAnalyzing || stage !== 'active') {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isAnalyzing, stage]);
  
  // Rest timer
  useEffect(() => {
    if (stage === 'rest') {
      restTimerRef.current = window.setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            // Rest period complete, start next set
            if (restTimerRef.current) {
              clearInterval(restTimerRef.current);
              restTimerRef.current = null;
            }
            setStage('active');
            setRestTime(120); // Reset rest time for next use
            setRepetitions(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [stage]);
  
  // Flash green when series is complete
  useEffect(() => {
    if (showCompletionFlash) {
      const timer = setTimeout(() => {
        setShowCompletionFlash(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showCompletionFlash]);
  
  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setStage('active');
    toast({
      title: "Treino iniciado",
      description: "Posicione-se na frente da câmera.",
      duration: 2000,
    });
  };
  
  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
    setStage('complete');
    
    // Save progress
    if (exercise) {
      const muscleGroupId = getMuscleGroupFromExercise(exercise.id);
      const progressKey = `progress_${muscleGroupId}`;
      const savedProgress = localStorage.getItem(progressKey);
      const progress = savedProgress ? JSON.parse(savedProgress) : {};
      
      // Update series count for this exercise
      progress[exercise.id] = series;
      localStorage.setItem(progressKey, JSON.stringify(progress));
    }
    
    // Show completion toast
    toast({
      title: "Treino finalizado",
      description: `Você completou ${series} séries e ${repStats.total} repetições.`,
      duration: 3000,
    });
  };
  
  const handleRepetitionCounted = (quality: 'good' | 'average' | 'poor') => {
    setRepetitions(prev => {
      const newValue = prev + 1;
      console.log(`Repetição #${newValue} contabilizada (Qualidade: ${quality})`);
      
      // Update rep stats
      setRepStats(prevStats => ({
        total: prevStats.total + 1,
        good: quality === 'good' ? prevStats.good + 1 : prevStats.good,
        average: quality === 'average' ? prevStats.average + 1 : prevStats.average,
        poor: quality === 'poor' ? prevStats.poor + 1 : prevStats.poor
      }));
      
      // Show visual feedback based on quality
      setFeedbackType(quality);
      setTimeout(() => setFeedbackType(null), 1000); // Remove visual feedback after 1s
      
      // Check if set is complete (12 reps)
      if (newValue >= 12) {
        // Show completion flash
        setShowCompletionFlash(true);
        
        // Increment series count
        setSeries(prevSeries => prevSeries + 1);
        
        // Enter rest period after short delay
        setTimeout(() => {
          setStage('rest');
          setRepetitions(0);
          
          toast({
            title: "Série completa!",
            description: "Descanse antes da próxima série.",
            duration: 2000,
          });
        }, 1000);
      }
      
      return newValue;
    });
  };
  
  const handleFeedback = (message: string) => {
    if (message !== feedback) {
      setFeedback(message);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getMuscleGroupFromExercise = (exerciseId: string): string => {
    // Map exercise IDs to muscle groups
    // This is a simple implementation - in a real app, you'd have a more robust solution
    const mapping: {[key: string]: string} = {
      "squat": "pernas",
      "lunge": "pernas",
      "sumo": "pernas",
      "calf": "pernas",
      "pushup": "peito",
      "dips": "peito",
      "incline": "peito",
      "flyes": "peito",
      "row": "costas",
      "pullup": "costas",
      "superman": "costas",
      "latpull": "costas",
      "press": "ombro",
      "frontrise": "ombro",
      "shrugs": "ombro",
      "circle": "ombro",
      "curl": "biceps-triceps",
      "hammer": "biceps-triceps",
      "tricepsext": "biceps-triceps",
      "kickback": "biceps-triceps",
      "crunch": "abdomen",
      "plank": "abdomen",
      "legrise": "abdomen",
      "bicycle": "abdomen",
    };
    
    return mapping[exerciseId] || "";
  };
  
  const handleFinishWorkout = () => {
    navigate('/workout/summary', { 
      state: { 
        elapsedTime, 
        series, 
        repStats 
      } 
    });
  };
  
  const handleBack = () => {
    const muscleGroupId = getMuscleGroupFromExercise(exerciseId);
    navigate(`/workout/exercises/${muscleGroupId}`);
  };

  const toggleDashboard = () => {
    setShowDashboard(prev => !prev);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      
      {/* Exercise Introduction Animation */}
      {stage === 'intro' && (
        <ExerciseAnimation 
          exerciseId={exerciseId} 
          onComplete={handleIntroComplete} 
        />
      )}
      
      {/* Flashing overlay for series completion */}
      {showCompletionFlash && (
        <div className="fixed inset-0 bg-green-500 bg-opacity-50 z-40 animate-pulse flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-bold text-center">Série completa!</h2>
          </div>
        </div>
      )}
      
      {/* Feedback overlays */}
      {feedbackType && (
        <div className={`fixed inset-0 z-30 ${
          feedbackType === 'good' ? 'bg-green-500' :
          feedbackType === 'average' ? 'bg-yellow-500' :
          'bg-red-500'
        } bg-opacity-30 pointer-events-none`} />
      )}
      
      <main className="flex-grow">
        <div className="formfit-container py-4 px-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="formfit-subheading text-center">{exercise?.name}</h1>
            <button
              onClick={toggleDashboard}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Timer className="h-5 w-5" />
            </button>
          </div>
          
          {/* Instagram-style progress bar */}
          <div className="h-1 bg-gray-200 w-full rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-formfit-blue transition-all duration-300 ease-out"
              style={{ width: `${repProgress}%` }}
            ></div>
          </div>
          
          {/* Dashboard View */}
          {showDashboard ? (
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <WorkoutDashboard 
                elapsedTime={elapsedTime}
                repStats={repStats}
                series={series}
              />
              <Button
                onClick={toggleDashboard}
                className="w-full mt-4"
                variant="outline"
              >
                Voltar ao Treino
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Exercise visualization area */}
              <div className="aspect-video relative bg-gray-100">
                {stage === 'setup' && !isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-50 text-white">
                    <h2 className="text-2xl font-bold mb-6">Preparado para começar?</h2>
                    <Button
                      onClick={handleStartAnalysis}
                      className="bg-formfit-blue hover:bg-formfit-blue/90 text-white px-8 py-6"
                      size="lg"
                    >
                      Iniciar Exercício
                    </Button>
                  </div>
                )}
                
                {stage === 'rest' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-70 text-white">
                    <h2 className="text-2xl font-bold mb-2">Descanse</h2>
                    <div className="text-5xl font-bold mb-4">{formatTime(restTime)}</div>
                    <p className="text-lg">Próxima série em breve</p>
                  </div>
                )}
                
                {stage === 'complete' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-70 text-white p-4">
                    <h2 className="text-2xl font-bold mb-4">Treino Finalizado!</h2>
                    <p className="text-lg mb-2">Séries: {series}/3</p>
                    <p className="text-lg mb-6">Repetições: {repStats.total}</p>
                    <Button
                      onClick={handleFinishWorkout}
                      className="bg-green-500 hover:bg-green-600"
                      size="lg"
                    >
                      Ver Resumo
                    </Button>
                  </div>
                )}
                
                {/* Pose detection component */}
                {isAnalyzing && (
                  <EnhancedPoseDetection
                    exercise={exerciseId}
                    onRepetitionCount={handleRepetitionCounted}
                    onFeedback={handleFeedback}
                  />
                )}
              </div>
              
              {/* Stats and controls */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Timer className="h-5 w-5 text-formfit-blue" />
                    <span className="font-medium">{formatTime(elapsedTime)}</span>
                  </div>
                  
                  <div className="px-4 py-1 bg-formfit-blue rounded-full text-white font-medium">
                    Série {series + 1}/3
                  </div>
                  
                  <div className="text-lg font-bold">
                    {repetitions}/12 reps
                  </div>
                </div>
                
                {/* Feedback area */}
                <div className={`p-3 rounded-lg mb-4 ${
                  feedback?.includes('Correto') || feedback?.includes('Boa') || feedback?.includes('Excelente') 
                    ? 'bg-green-100 text-green-800'
                    : feedback?.includes('Ajuste') || feedback?.includes('Razoável')
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-50 text-red-800'
                }`}>
                  <p className="font-medium">{feedback || "Aguardando..."}</p>
                </div>
                
                {/* Controls */}
                {isAnalyzing && stage === 'active' && (
                  <Button
                    onClick={handleStopAnalysis}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    size="lg"
                  >
                    <StopCircle className="mr-2 h-5 w-5" /> Finalizar Treino
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExerciseExecution;
