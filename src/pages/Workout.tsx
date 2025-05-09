
import React, { useRef, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import FormFitHeader from '@/components/FormFitHeader';
import PoseDetection from '@/components/PoseDetection';
import ExerciseSelector from '@/components/ExerciseSelector';
import ExerciseAnimation from '@/components/ExerciseAnimation';
import WorkoutDashboard from '@/components/WorkoutDashboard';
import Footer from '@/components/Footer';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { Button } from '@/components/ui/button';
import { Camera, Play, Pause, BarChart2 } from 'lucide-react';

const Workout: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [exerciseStats, setExerciseStats] = useState({
    repetitions: 0,
    series: 0,
    quality: { good: 0, average: 0, poor: 0 }
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { toast } = useToast();
  const timerRef = useRef<number | null>(null);

  // Start the timer when we begin analysis
  useEffect(() => {
    if (isAnalyzing && !timerRef.current) {
      const startTime = Date.now() - (elapsedTime * 1000); // Account for previous time
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (!isAnalyzing && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAnalyzing, elapsedTime]);

  const handleExerciseSelect = (exercise: string) => {
    setSelectedExercise(exercise);
    setExerciseStats({
      repetitions: 0,
      series: 0,
      quality: { good: 0, average: 0, poor: 0 }
    });
    setElapsedTime(0);
    setFeedback(null);
    setShowAnimation(true);
    
    toast({
      title: "Exercício selecionado",
      description: `${exercise} foi selecionado. Veja a demonstração e posicione-se.`,
    });
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setIsAnalyzing(true);
    toast({
      title: "Análise iniciada",
      description: "Posicione-se na frente da câmera e comece o exercício.",
      duration: 3000,
    });
  };

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    toast({
      title: "Análise iniciada",
      description: "Posicione-se na frente da câmera e comece o exercício.",
      duration: 3000,
    });
  };

  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
    toast({
      title: "Análise pausada",
      description: "Você pode retomar quando estiver pronto.",
      duration: 3000,
    });
  };

  const handleToggleDashboard = () => {
    setShowDashboard(prev => !prev);
  };

  // Função de callback para contabilizar repetições
  const handleRepetitionCounted = () => {
    console.log("🏋️ Repetição contabilizada no Workout.tsx!");
    setExerciseStats(prev => {
      // Randomly assign quality for demo purposes - in real app would be based on exercise quality
      const qualities = ['good', 'average', 'poor'];
      const qualityIndex = Math.floor(Math.random() * 3);
      const quality = qualities[qualityIndex] as 'good' | 'average' | 'poor';
      
      const newQuality = {
        good: quality === 'good' ? prev.quality.good + 1 : prev.quality.good,
        average: quality === 'average' ? prev.quality.average + 1 : prev.quality.average,
        poor: quality === 'poor' ? prev.quality.poor + 1 : prev.quality.poor
      };
      
      const repetitions = prev.repetitions + 1;
      let series = prev.series;
      
      // Check if we should increment the series (e.g., every 10 reps)
      if (repetitions % 10 === 0 && repetitions > 0) {
        series += 1;
        toast({
          title: "Série Completa!",
          description: `Você completou ${series} séries de ${selectedExercise}`,
          duration: 3000,
          variant: "default",
        });
      }
      
      // Toast notification for the rep
      toast({
        title: "🏋️ Repetição!",
        description: `Repetição #${repetitions} contabilizada`,
        duration: 1000,
        variant: "default",
      });
      
      return {
        repetitions,
        series,
        quality: newQuality
      };
    });
  };

  const handleFeedback = (message: string) => {
    console.log("🗨️ Feedback recebido:", message);
    setFeedback(message);
  };

  const exerciseId = selectedExercise ? 
    selectedExercise.toLowerCase().replace(/\s+/g, '') : 'squat';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <h1 className="formfit-heading text-center mb-8">Seu Personal Trainer Virtual</h1>
          
          {!selectedExercise ? (
            <ExerciseSelector onSelectExercise={handleExerciseSelect} />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="formfit-subheading">{selectedExercise}</h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleToggleDashboard}
                    variant="outline"
                  >
                    <BarChart2 className="mr-2 h-4 w-4" />
                    {showDashboard ? 'Ocultar Dashboard' : 'Mostrar Dashboard'}
                  </Button>
                  <Button
                    onClick={() => setSelectedExercise(null)}
                    variant="outline"
                  >
                    Mudar exercício
                  </Button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
                  {isAnalyzing ? (
                    <PoseDetection 
                      exercise={selectedExercise}
                      onRepetitionCount={handleRepetitionCounted}
                      onFeedback={handleFeedback}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="mx-auto h-16 w-16 text-gray-400" />
                        <p className="mt-4 text-gray-500">Câmera desativada</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!showDashboard ? (
                <>
                  <div className="flex justify-center space-x-4">
                    {!isAnalyzing ? (
                      <Button 
                        onClick={handleStartAnalysis}
                        className="bg-formfit-blue hover:bg-formfit-blue/90"
                        size="lg"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        Iniciar
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleStopAnalysis}
                        variant="outline"
                        size="lg"
                      >
                        <Pause className="mr-2 h-5 w-5" />
                        Pausar
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-xl font-bold mb-2">Repetições</h3>
                      <div className="text-5xl font-bold text-formfit-blue">{exerciseStats.repetitions}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-xl font-bold mb-2">Feedback</h3>
                      <div className={`text-lg ${feedback?.includes('Correto') || feedback?.includes('Boa!') || feedback?.includes('Excelente') ? 'text-green-500' : feedback?.includes('Ruim') || feedback?.includes('Afaste') ? 'text-amber-500' : 'text-blue-500'}`}>
                        {feedback || "Aguardando..."}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <WorkoutDashboard
                  elapsedTime={elapsedTime}
                  repStats={{
                    total: exerciseStats.repetitions,
                    good: exerciseStats.quality.good,
                    average: exerciseStats.quality.average,
                    poor: exerciseStats.quality.poor
                  }}
                  series={exerciseStats.series}
                />
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />

      {/* Exercise Animation Overlay */}
      {showAnimation && selectedExercise && (
        <ExerciseAnimation 
          exerciseId={exerciseId}
          onComplete={handleAnimationComplete} 
        />
      )}
    </div>
  );
};

export default Workout;
