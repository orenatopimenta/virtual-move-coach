import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Timer, StopCircle, RefreshCw, Home, Play, Pause } from 'lucide-react';
import EnhancedPoseDetection from '@/components/EnhancedPoseDetection';
import ExerciseAnimation from '@/components/ExerciseAnimation';
import WorkoutDashboard from '@/components/WorkoutDashboard';
import { saveWorkoutToSupabase } from '@/lib/saveWorkoutToSupabase';
import { supabase } from '@/lib/supabaseClient';
import deburr from 'lodash/deburr';

interface ExerciseData {
  id: string;
  name: string;
  muscles: string;
  modelo?: string;
  carga?: string;
}

type ExerciseStage = 'intro' | 'setup' | 'active' | 'paused' | 'rest' | 'complete';

interface RepStats {
  total: number;
  good: number;
  average: number;
  poor: number;
}

interface RepIndicator {
  minAngle: number;
  maxAngle: number;
  executionTime: number;
  amplitude: number;
  upVelocity: number;
  downVelocity: number;
}

// Lista de referência de todos os exercícios usados no app
const TODOS_EXERCICIOS = [
  { id: 'squat', name: 'Agachamento' },
  { id: 'agachamento', name: 'Agachamento' },
  { id: 'push-up', name: 'Flexão de Braço' },
  { id: 'pushup', name: 'Flexão de Braço' },
  { id: 'flexao', name: 'Flexão de Braço' },
  { id: 'biceps-curl', name: 'Rosca Bíceps' },
  { id: 'curl', name: 'Rosca Bíceps' },
  { id: 'lunge', name: 'Avanço' },
  { id: 'afundo', name: 'Avanço' },
  { id: 'leg-press', name: 'Leg Press' },
  { id: 'cadeira-extensora', name: 'Cadeira Extensora' },
  { id: 'hammer-curl', name: 'Rosca Hammer' },
  { id: 'triceps', name: 'Extensão de Tríceps' },
  { id: 'rosca-triceps', name: 'Rosca Tríceps' },
  { id: 'supino', name: 'Supino' },
  { id: 'crossover', name: 'Crossover' },
  { id: 'crossover-baixo', name: 'Crossover Baixo' },
  { id: 'remada', name: 'Remada' },
  { id: 'lat-push', name: 'Lat Push' },
  { id: 'lat-pull', name: 'Lat Pull' },
  { id: 'seated-row', name: 'Seated Row' },
  { id: 'abdominal', name: 'Abdominal' },
  { id: 'levantamento-lateral', name: 'Levantamento Lateral' },
  { id: 'levantamento-frontal', name: 'Levantamento Frontal' },
  { id: 'desenvolvimento', name: 'Desenvolvimento' },
  { id: 'crucifixo-invertido', name: 'Crucifixo Invertido' },
  { id: 'calfRaises', name: 'Elevação de Panturrilha' },
  { id: 'jumpSquat', name: 'Agachamento com Salto' },
  // ... adicione outros exercícios conforme necessário ...
];

const ExerciseExecution: React.FC = () => {
  const { exerciseId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [exercise, setExercise] = useState<ExerciseData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState<ExerciseStage>('intro'); // Starting with intro stage for animation
  const [repetitions, setRepetitions] = useState(0);
  const [series, setSeries] = useState(1); // Começa em 1
  const totalSeries = 3;
  const repsPerSeries = 12;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(60); // tempo de descanso em segundos (exemplo: 60s)
  const restDuration = 60; // duração do descanso em segundos
  const [showCompletionFlash, setShowCompletionFlash] = useState(false);
  const [repStats, setRepStats] = useState<RepStats>({ total: 0, good: 0, average: 0, poor: 0 });
  const [feedbackType, setFeedbackType] = useState<'good' | 'average' | 'poor' | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [repIndicators, setRepIndicators] = useState<RepIndicator[]>([]);
  const [workoutSaved, setWorkoutSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Progress bar for repetitions
  const repProgress = (repetitions / repsPerSeries) * 100;
  
  // Timer refs
  const timerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  
  // Load exercise data and progress
  useEffect(() => {
    const normalize = (str: string) => deburr(str || '').toLowerCase();
    const exerciseData = localStorage.getItem("currentExercise");
    if (exerciseData) {
      const parsed = JSON.parse(exerciseData);
      let ref = null;
      if (parsed.id) {
        ref = TODOS_EXERCICIOS.find(e => normalize(e.id) === normalize(parsed.id) || normalize(e.name) === normalize(parsed.id));
      }
      if (!ref && parsed.name) {
        ref = TODOS_EXERCICIOS.find(e => normalize(e.name) === normalize(parsed.name));
      }
      setExercise({ ...parsed, name: ref?.name || parsed.name || "Exercício" });
    } else {
      const ref = TODOS_EXERCICIOS.find(e => normalize(e.id) === normalize(exerciseId) || normalize(e.name) === normalize(exerciseId));
      setExercise({
        id: exerciseId,
        name: ref?.name || "Exercício",
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
            setRestTime(60); // Reset rest time for next use
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
  
  useEffect(() => {
    if (isResting && restTime > 0) {
      const timer = setTimeout(() => setRestTime(restTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isResting, restTime]);
  
  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setStage('active');
    toast({
      title: "Treino iniciado",
      description: "Posicione-se na frente da câmera.",
      duration: 2000,
    });
  };

  const handlePauseAnalysis = () => {
    if (stage === 'active') {
      setStage('paused');
      toast({
        title: "Treino pausado",
        description: "Clique em Retomar para continuar.",
        duration: 2000,
      });
    } else if (stage === 'paused') {
      setStage('active');
      toast({
        title: "Treino retomado",
        description: "Continue seu exercício.",
        duration: 2000,
      });
    }
  };

  const handleRestartAnalysis = () => {
    // Reset stats
    setRepetitions(0);
    setFeedback(null);
    setFeedbackType(null);
    
    // Start fresh
    setStage('active');
    setIsAnalyzing(true);
    toast({
      title: "Treino reiniciado",
      description: "Posicione-se na frente da câmera.",
      duration: 2000,
    });
  };
  
  const handleStopAnalysis = () => {
    // Stop camera
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Show completion modal
    setShowCompletionModal(true);
  };
  
  // Handler para repetições sem métrica detalhada (ex: pushup, lunge)
  const handleRepetitionQuality = (quality: 'good' | 'average' | 'poor') => {
    // Só conta repetições se o exercício não for de métrica detalhada
    if (['squat', 'agachamento', 'curl', 'hammer-curl', 'rosca-triceps'].includes(exercise?.id || '')) return;
    setRepetitions(prevReps => {
      if (prevReps + 1 >= repsPerSeries) {
        if (series >= totalSeries) {
          setShowCompletionModal(true);
          return 0;
        } else {
          setIsResting(true);
          setStage('rest');
          setRestTime(restDuration);
          setTimeout(() => {
            setSeries(prevSeries => prevSeries + 1);
            setIsResting(false);
            setStage('active');
            setRepetitions(0);
          }, restDuration * 1000);
          return 0;
        }
      } else {
        return prevReps + 1;
      }
    });
  };

  // Handler para repetições com métrica detalhada
  const handleRepetitionCounted = (indicator?: RepIndicator) => {
    // Só conta repetições se o exercício for de métrica detalhada
    if (!['squat', 'agachamento', 'curl', 'hammer-curl', 'rosca-triceps'].includes(exercise?.id || '')) return;
    if (stage !== 'active') return;
    setRepetitions(prevReps => {
      if (indicator) setRepIndicators(prev => [...prev, indicator]);
      if (prevReps + 1 >= repsPerSeries) {
        if (series >= totalSeries) {
          setShowCompletionModal(true);
          return 0;
        } else {
          setIsResting(true);
          setStage('rest');
          setRestTime(restDuration);
          setTimeout(() => {
            setSeries(prevSeries => prevSeries + 1);
            setIsResting(false);
            setStage('active');
            setRepetitions(0);
          }, restDuration * 1000);
          return 0;
        }
      } else {
        return prevReps + 1;
      }
    });
  };

  const handleRepIndicatorExtracted = (indicator?: RepIndicator) => {
    if (!indicator || typeof indicator.minAngle !== 'number') return;
    handleRepetitionCounted(indicator);
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
      "agachamento": "pernas",
      "lunge": "pernas",
      "afundo": "pernas",
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
      "curl": "braco",
      "hammer": "braco",
      "tricepsext": "braco",
      "kickback": "braco",
      "crunch": "abdomen",
      "plank": "abdomen",
      "legrise": "abdomen",
      "bicycle": "abdomen",
    };
    
    return mapping[exerciseId] || "";
  };
  
  const handleViewSummary = () => {
    navigate('/workout/summary', {
      state: {
        elapsedTime: elapsedTime,
        series: series,
        repStats: {
          total: repStats.total,
          good: repStats.good,
          average: repStats.average,
          poor: repStats.poor
        }
      }
    });
  };
  
  const handleBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const toggleDashboard = () => {
    setShowDashboard(prev => !prev);
  };
  
  const completedSeries = repetitions === 0 ? series - 1 : series - (repetitions < repsPerSeries ? 1 : 0);
  const completedReps = completedSeries * repsPerSeries;
  
  const handleSaveWorkout = async () => {
    if (workoutSaved || isSaving) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Usuário não autenticado', variant: 'destructive' });
        setIsSaving(false);
        return;
      }
      if (['squat', 'agachamento', 'curl', 'hammer-curl', 'rosca-triceps'].includes(exercise?.id || '')) {
        if (repIndicators.length < 1) {
          toast({ title: 'Nenhuma métrica de repetição para salvar.' });
          setIsSaving(false);
          return;
        }
      }
      // Dividir as métricas em sets de repsPerSeries
      const sets: any[] = [];
      let repCount = 0;
      let setNumber = 1;
      // Só salva a quantidade de séries realmente executadas
      while (repCount + repsPerSeries <= repIndicators.length) {
        const metrics = repIndicators.slice(repCount, repCount + repsPerSeries).map((indicator, idx) => ({
          repetitionNumber: parseFloat((idx + 1).toFixed(2)),
          quality: 'good',
          duration_seconds: parseFloat(indicator.executionTime.toFixed(2)),
          extra_data: {
            minAngle: parseFloat(indicator.minAngle.toFixed(2)),
            maxAngle: parseFloat(indicator.maxAngle.toFixed(2)),
            executionTime: parseFloat(indicator.executionTime.toFixed(2)),
            amplitude: parseFloat(indicator.amplitude.toFixed(2)),
            upVelocity: parseFloat(indicator.upVelocity.toFixed(2)),
            downVelocity: parseFloat(indicator.downVelocity.toFixed(2)),
            modelo: exercise?.modelo || (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('currentExercise') || '{}').modelo) : undefined),
            carga: exercise?.carga ?? (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('currentExercise') || '{}').carga) : undefined)
          }
        }));
        sets.push({
          seriesNumber: setNumber,
          repetitions: metrics.length,
          completed: true,
          metrics
        });
        repCount += repsPerSeries;
        setNumber++;
      }
      // Se restou uma série incompleta (menos que repsPerSeries, mas > 0), salva como série incompleta
      const repsRestantes = repIndicators.length % repsPerSeries;
      if (repsRestantes > 0) {
        const metrics = repIndicators.slice(repCount).map((indicator, idx) => ({
          repetitionNumber: parseFloat((idx + 1).toFixed(2)),
          quality: 'good',
          duration_seconds: parseFloat(indicator.executionTime.toFixed(2)),
          extra_data: {
            minAngle: parseFloat(indicator.minAngle.toFixed(2)),
            maxAngle: parseFloat(indicator.maxAngle.toFixed(2)),
            executionTime: parseFloat(indicator.executionTime.toFixed(2)),
            amplitude: parseFloat(indicator.amplitude.toFixed(2)),
            upVelocity: parseFloat(indicator.upVelocity.toFixed(2)),
            downVelocity: parseFloat(indicator.downVelocity.toFixed(2)),
            modelo: exercise?.modelo || (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('currentExercise') || '{}').modelo) : undefined),
            carga: exercise?.carga ?? (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('currentExercise') || '{}').carga) : undefined)
          }
        }));
        sets.push({
          seriesNumber: setNumber,
          repetitions: metrics.length,
          completed: false,
          metrics
        });
      }
      await saveWorkoutToSupabase({
        userId: user.id,
        totalTime: Math.round(elapsedTime / 60),
        xp: sets.length * 10,
        exercises: [
          {
            name: exercise?.name || 'Exercício',
            modelo: exercise?.modelo || (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('currentExercise') || '{}').modelo) : undefined),
            carga: exercise?.carga ?? (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('currentExercise') || '{}').carga) : undefined),
            sets
          }
        ]
      });
      setWorkoutSaved(true);
      toast({ title: 'Treino salvo com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar treino', description: err?.message || JSON.stringify(err), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  function getAnimationId(exercise) {
    if (!exercise) return 'squat';
    const normalize = (str) => (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    // Mapeamento expandido para todos os exercícios conhecidos
    const mapping = {
      'agachamento': 'squat',
      'squat': 'squat',
      'push-up': 'pushup',
      'pushup': 'pushup',
      'flexao': 'pushup',
      'flexão': 'pushup',
      'biceps-curl': 'curl',
      'curl': 'curl',
      'rosca biceps': 'curl',
      'rosca bíceps': 'curl',
      'lunge': 'lunge',
      'afundo': 'lunge',
      'leg-press': 'leg-press',
      'cadeira-extensora': 'cadeira-extensora',
      'hammer-curl': 'hammer-curl',
      'triceps': 'triceps',
      'rosca-triceps': 'rosca-triceps',
      'supino': 'supino',
      'crossover': 'crossover',
      'crossover-baixo': 'crossover-baixo',
      'remada': 'remada',
      'lat-push': 'lat-push',
      'lat-pull': 'lat-pull',
      'seated-row': 'seated-row',
      'abdominal': 'abdominal',
      'levantamento-lateral': 'levantamento-lateral',
      'levantamento-frontal': 'levantamento-frontal',
      'desenvolvimento': 'desenvolvimento',
      'crucifixo-invertido': 'crucifixo-invertido',
      'calfraises': 'calfRaises',
      'elevação de panturrilha': 'calfRaises',
      'jumpsquat': 'jumpSquat',
      'agachamento com salto': 'jumpSquat',
      'plank': 'plank',
      'prancha': 'plank',
      // Adicione outros mapeamentos conforme necessário
    };
    const idNorm = normalize(exercise.id);
    if (mapping[idNorm]) return mapping[idNorm];
    const nameNorm = normalize(exercise.name);
    if (mapping[nameNorm]) return mapping[nameNorm];
    return idNorm || 'squat';
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      
      {/* Exercise Introduction Animation */}
      {stage === 'intro' && (
        <ExerciseAnimation 
          exerciseId={getAnimationId(exercise)} 
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
        <div className="formfit-container py-1 px-1">
          <div className="flex items-center justify-between mb-0 min-h-0 h-12" style={{paddingTop: 0, paddingBottom: 0}}>
            <button
              onClick={handleBack}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 flex items-center justify-center">
              <h1 className="formfit-heading text-center text-xs sm:text-base md:text-lg lg:text-xl m-0">
                Execução do exercício{exercise?.name ? `: ${exercise.name}` : ''}
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleGoToDashboard}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors mr-1"
                title="Ir para Dashboard"
              >
                <Home className="h-5 w-5" />
              </button>
              <button
                onClick={toggleDashboard}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                title="Ver estatísticas"
              >
                <Timer className="h-5 w-5" />
              </button>
            </div>
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden min-h-[500px]">
              {/* Exercise visualization area */}
              <div className="relative bg-gray-100">
                {stage === 'setup' && !isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-50 text-white min-h-[60vh]">
                    <h2 className="text-2xl font-bold mb-6">Preparado para começar?</h2>
                    <Button
                      onClick={handleStartAnalysis}
                      className="bg-formfit-blue hover:bg-formfit-blue/90 text-white px-8 py-6"
                      size="lg"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Iniciar Exercício
                    </Button>
                  </div>
                )}
                
                {stage === 'paused' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-70 text-white">
                    <h2 className="text-2xl font-bold mb-4">Treino Pausado</h2>
                    <div className="flex space-x-4">
                      <Button
                        onClick={handlePauseAnalysis}
                        className="bg-green-500 hover:bg-green-600"
                        size="lg"
                      >
                        <Play className="mr-2 h-5 w-5" /> Retomar
                      </Button>
                      <Button
                        onClick={handleRestartAnalysis}
                        className="bg-blue-500 hover:bg-blue-600"
                        size="lg"
                      >
                        <RefreshCw className="mr-2 h-5 w-5" /> Reiniciar
                      </Button>
                    </div>
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
                    <p className="text-lg mb-2">Séries: {series}/{totalSeries}</p>
                    <p className="text-lg mb-6">Repetições: {repStats.total}</p>
                    <div className="flex space-x-4">
                      <Button
                        onClick={handleRestartAnalysis}
                        className="bg-blue-500 hover:bg-blue-600"
                        size="lg"
                      >
                        <RefreshCw className="mr-2 h-5 w-5" /> Novo Treino
                      </Button>
                      <Button
                        onClick={async () => { await handleSaveWorkout(); handleViewSummary(); }}
                        className="bg-formfit-blue hover:bg-formfit-blue/90 text-white"
                        size="lg"
                      >
                        Ver Resumo do Treino
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Pose detection component */}
                {(stage === 'active' || stage === 'paused') && (
                  <div className="relative">
                    <EnhancedPoseDetection 
                      exercise={exercise?.id || ""} 
                      onRepetitionCount={handleRepetitionQuality}
                      onFeedback={handleFeedback}
                      videoRef={videoRef}
                      onRepIndicatorExtracted={handleRepIndicatorExtracted}
                      stage={stage}
                    />
                  </div>
                )}
              </div>
              
              {/* Stats and controls */}
              <div className="p-2 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Timer className="h-5 w-5 text-formfit-blue" />
                    <span className="font-medium">{formatTime(elapsedTime)}</span>
                  </div>
                  
                  <div className="px-4 py-1 bg-formfit-blue rounded-full text-white font-medium">
                    Série {series}/{totalSeries}
                  </div>
                  
                  <div className="text-lg font-bold">
                    {repetitions}/{repsPerSeries} reps
                  </div>
                </div>

                {/* Control buttons */}
                {(stage === 'active' || stage === 'paused') && (
                  <div className="flex justify-center gap-4 mb-4">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => {
                        console.log('Pause button clicked');
                        handlePauseAnalysis();
                      }}
                      className="flex items-center gap-2"
                    >
                      {stage === 'active' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      {stage === 'active' ? 'Pausar' : 'Retomar'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="lg" 
                      onClick={() => {
                        console.log('Stop button clicked');
                        handleStopAnalysis();
                      }}
                      className="flex items-center gap-2"
                      disabled={isSaving || workoutSaved}
                    >
                      <StopCircle className="h-5 w-5" />
                      Finalizar
                    </Button>
                  </div>
                )}
                
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
              </div>
            </div>
          )}
        </div>
      </main>

      {showCompletionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md w-full mx-4">
            {completedSeries <= 0 ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-center">Treino pausado</h2>
                <p className="text-gray-600 mb-6 text-center">
                  Você está na {series}ª série com {repetitions} repetições.
                </p>
                <div className="flex flex-col space-y-4 w-full">
                  <Button
                    onClick={() => setShowCompletionModal(false)}
                    className="w-full bg-formfit-blue hover:bg-formfit-blue/90 text-white"
                  >
                    Retomar Treino
                  </Button>
                  <Button
                    onClick={() => navigate(location.state?.returnTo || '/treinos')}
                    variant="outline"
                    className="w-full"
                  >
                    Voltar para Treinos
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 text-center">Você concluiu o treino!</h2>
                <p className="text-gray-600 mb-6 text-center">
                  Você completou {completedSeries} série(s) e {completedReps} repetições.
                </p>
                <div className="flex flex-col space-y-4 w-full">
                  <Button
                    onClick={async () => { await handleSaveWorkout(); handleViewSummary(); }}
                    className="w-full bg-formfit-blue hover:bg-formfit-blue/90 text-white"
                  >
                    Ver Resumo do Treino
                  </Button>
                  <Button
                    onClick={async () => { await handleSaveWorkout(); navigate(location.state?.returnTo || '/treinos'); }}
                    variant="outline"
                    className="w-full"
                  >
                    Voltar para Treinos
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isResting && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-90 z-50">
          <div className="bg-white p-8 rounded shadow-lg flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Modo descanso</h2>
            <p className="text-3xl font-mono">{restTime}s</p>
          </div>
        </div>
      )}

      {/* Tabela dinâmica de indicadores */}
      {repIndicators.length > 0 && repIndicators.every(r => r && typeof r.minAngle === 'number') ? (
        <div className="overflow-x-auto mt-6 flex justify-center">
          <table className="min-w-[500px] text-xs text-center bg-white rounded-lg shadow border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="font-bold py-2 px-4 text-left">Indicador</th>
                {repIndicators.map((_, idx) => (
                  <th key={idx} className="font-bold py-2 px-4 min-w-[70px]">Rep {idx + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold py-2 px-4 text-left">Ângulo Mínimo</td>
                {repIndicators.map((r, idx) => <td key={idx} className="py-2 px-4">{r.minAngle.toFixed(1)}º</td>)}
              </tr>
              <tr>
                <td className="font-bold py-2 px-4 text-left">Ângulo Máximo</td>
                {repIndicators.map((r, idx) => <td key={idx} className="py-2 px-4">{r.maxAngle.toFixed(1)}º</td>)}
              </tr>
              <tr>
                <td className="font-bold py-2 px-4 text-left">Tempo Execução</td>
                {repIndicators.map((r, idx) => <td key={idx} className="py-2 px-4">{r.executionTime.toFixed(2)}s</td>)}
              </tr>
              <tr>
                <td className="font-bold py-2 px-4 text-left">Amplitude</td>
                {repIndicators.map((r, idx) => <td key={idx} className="py-2 px-4">{r.amplitude.toFixed(1)}º</td>)}
              </tr>
              <tr>
                <td className="font-bold py-2 px-4 text-left">Vel. Subida</td>
                {repIndicators.map((r, idx) => <td key={idx} className="py-2 px-4">{r.upVelocity.toFixed(2)}º/s</td>)}
              </tr>
              <tr>
                <td className="font-bold py-2 px-4 text-left">Vel. Descida</td>
                {repIndicators.map((r, idx) => <td key={idx} className="py-2 px-4">{r.downVelocity.toFixed(2)}º/s</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 flex justify-center">
          <table className="min-w-[350px] text-xs text-left bg-white rounded-lg shadow border border-gray-200">
            <tbody>
              <tr><td className="font-bold py-2 px-4">Ângulo Mínimo</td></tr>
              <tr><td className="font-bold py-2 px-4">Ângulo Máximo</td></tr>
              <tr><td className="font-bold py-2 px-4">Tempo Execução</td></tr>
              <tr><td className="font-bold py-2 px-4">Amplitude</td></tr>
              <tr><td className="font-bold py-2 px-4">Vel. Subida</td></tr>
              <tr><td className="font-bold py-2 px-4">Vel. Descida</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExerciseExecution;
