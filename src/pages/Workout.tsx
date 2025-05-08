import React, { useRef, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import FormFitHeader from '@/components/FormFitHeader';
import PoseDetection from '@/components/PoseDetection';
import ExerciseSelector from '@/components/ExerciseSelector';
import Footer from '@/components/Footer';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { Button } from '@/components/ui/button';
import { Camera, Play, Pause } from 'lucide-react';

const Workout: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [repetitions, setRepetitions] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExerciseSelect = (exercise: string) => {
    setSelectedExercise(exercise);
    setRepetitions(0);
    setFeedback(null);
    toast({
      title: "Exercício selecionado",
      description: `${exercise} foi selecionado. Posicione seu dispositivo e pressione Iniciar.`,
    });
  };

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    toast({
      title: "Análise iniciada",
      description: "Posicione-se na frente da câmera e comece o exercício.",
    });
  };

  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
    toast({
      title: "Análise pausada",
      description: "Você pode retomar quando estiver pronto.",
    });
  };

  const handleRepetitionCounted = () => {
    setRepetitions(prev => prev + 1);
    console.log("Repetição contabilizada!");
  };

  const handleFeedback = (message: string) => {
    setFeedback(message);
  };

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
                <Button
                  onClick={() => setSelectedExercise(null)}
                  variant="outline"
                >
                  Mudar exercício
                </Button>
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

              <div className="flex justify-center space-x-4">
                {!isAnalyzing ? (
                  <Button 
                    onClick={handleStartAnalysis}
                    className="bg-formfit-blue hover:bg-formfit-blue/90"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStopAnalysis}
                    variant="outline"
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-2">Repetições</h3>
                  <div className="text-5xl font-bold text-formfit-blue">{repetitions}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-2">Feedback</h3>
                  <div className={`text-lg ${feedback?.includes('Correto') ? 'text-green-500' : 'text-amber-500'}`}>
                    {feedback || "Aguardando..."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Workout;
