import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import FormFitHeader from '@/components/FormFitHeader';
import OptimizedPoseDetection from '@/components/OptimizedPoseDetection';
import ExerciseSelector from '@/components/ExerciseSelector';
import ExerciseAnimation from '@/components/ExerciseAnimation';
import WorkoutDashboard from '@/components/WorkoutDashboard';
import Footer from '@/components/Footer';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { Button } from '@/components/ui/button';
import { Camera, Play, Pause, BarChart2 } from 'lucide-react';
import { saveWorkoutToSupabase } from '@/lib/saveWorkoutToSupabase';
import { supabase } from '@/lib/supabaseClient';
import { MODELOS } from './TreinoIA';
import deburr from 'lodash/deburr';

// Lista de referência de todos os exercícios usados no app
const TODOS_EXERCICIOS = [
  { id: 'squat', name: 'Agachamento' },
  { id: 'agachamento', name: 'Agachamento' },
  { id: 'push-up', name: 'Flexão de Braço' },
  { id: 'pushup', name: 'Flexão de Braço' },
  { id: 'flexao', name: 'Flexão de Braço' },
  { id: 'biceps-curl', name: 'Rosca Bíceps' },
  { id: 'curl', name: 'Rosca Bíceps' },
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
];

const Workout: React.FC = () => {
  // States
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [count, setCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [poseFeedback, setPoseFeedback] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { toast } = useToast();

  // Memoized handlers
  const handleExerciseSelect = useCallback((exercise: string) => {
    setSelectedExercise(exercise);
    setIsAnalyzing(true);
    setCount(0);
    setTimer(0);
    setFeedback('');
    setPoseFeedback('');
  }, []);

  const handleFeedback = useCallback((message: string) => {
    setPoseFeedback(message);
  }, []);

  const handleRepetitionCounted = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const handleStartStop = useCallback(() => {
    setIsAnalyzing(prev => !prev);
    if (isAnalyzing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } else {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
  }, [isAnalyzing]);

  const handlePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleShowStats = useCallback(() => {
    setShowStats(prev => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Memoized components
  const exerciseSelector = useMemo(() => (
    <ExerciseSelector onSelect={handleExerciseSelect} />
  ), [handleExerciseSelect]);

  const workoutDashboard = useMemo(() => (
    <WorkoutDashboard
      count={count}
      timer={timer}
      feedback={feedback}
      poseFeedback={poseFeedback}
      isPaused={isPaused}
      showStats={showStats}
      onShowStats={handleShowStats}
    />
  ), [count, timer, feedback, poseFeedback, isPaused, showStats, handleShowStats]);

  return (
    <div className="min-h-screen bg-gray-100">
      <FormFitHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Exercise selection and stats */}
          <div className="space-y-8">
            {exerciseSelector}
            {workoutDashboard}
          </div>

          {/* Right column - Camera feed and controls */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md h-[90vh]">
              <div className="h-full w-full rounded-lg overflow-hidden bg-gray-100 relative">
                <OptimizedPoseDetection 
                  exercise={selectedExercise}
                  onRepetitionCount={handleRepetitionCounted}
                  onFeedback={handleFeedback}
                  isActive={isAnalyzing && !isPaused}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleStartStop}
                className={`${isAnalyzing ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isAnalyzing ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isAnalyzing ? 'Parar' : 'Iniciar'}
              </Button>

              {isAnalyzing && (
                <Button
                  onClick={handlePause}
                  className={`${isPaused ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
                  {isPaused ? 'Continuar' : 'Pausar'}
                </Button>
              )}

              <Button
                onClick={handleShowStats}
                className="bg-gray-500 hover:bg-gray-600"
              >
                <BarChart2 className="mr-2 h-5 w-5" />
                Estatísticas
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Workout;
