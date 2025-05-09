
import React, { useState, useEffect } from 'react';
import { exerciseConfigs } from './pose-analysis/exercise-configs';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Play } from 'lucide-react';

interface ExerciseAnimationProps {
  exerciseId: string;
  onComplete: () => void;
}

const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({ exerciseId, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const config = exerciseConfigs[exerciseId] || exerciseConfigs.squat;

  useEffect(() => {
    // Simulate loading animation resource
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [exerciseId]);

  // Fallback animation using CSS if no animation URL available
  const renderFallbackAnimation = () => {
    switch (exerciseId) {
      case 'squat':
        return (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-4xl font-bold">🏋️</div>
            <div className="animate-bounce h-20 w-20 mb-4">👤</div>
            <div className="animate-ping h-20 w-20">👤</div>
          </div>
        );
      case 'plank':
        return (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-4xl font-bold">🧘</div>
            <div className="transform rotate-90 text-4xl">👤</div>
          </div>
        );
      case 'curl':
        return (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-4xl font-bold">💪</div>
            <div className="animate-pulse text-4xl">👤</div>
          </div>
        );
      default:
        return (
          <div className="animate-pulse text-6xl">🏋️</div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-4">{config.name}</h2>
        
        <div className="aspect-video bg-gray-100 rounded-md mb-6 flex items-center justify-center">
          {loading ? (
            <div className="animate-spin h-12 w-12 border-4 border-formfit-blue border-t-transparent rounded-full"></div>
          ) : config.animationUrl ? (
            <img 
              src={config.animationUrl} 
              alt={`Animação de ${config.name}`} 
              className="w-full h-full object-contain"
              onError={() => {
                toast({
                  title: "Erro ao carregar animação",
                  description: "Usando animação alternativa",
                  duration: 2000,
                });
              }}
            />
          ) : renderFallbackAnimation()}
        </div>
        
        <div className="text-center mb-6">
          <h3 className="font-medium mb-2">Como executar:</h3>
          <ul className="text-gray-700 text-left list-disc pl-5 space-y-1">
            <li>Posicione-se frente à câmera</li>
            <li>{config.positioningInstructions}</li>
            <li>Execute o movimento com controle</li>
            <li>Mantenha a postura durante todo o exercício</li>
          </ul>
        </div>
        
        <Button 
          onClick={onComplete}
          className="w-full bg-formfit-blue hover:bg-formfit-blue/90"
          size="lg"
        >
          <Play className="mr-2 h-5 w-5" />
          Iniciar Exercício
        </Button>
      </div>
    </div>
  );
};

export default ExerciseAnimation;
