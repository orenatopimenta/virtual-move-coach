import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { exerciseConfigs } from '@/components/pose-analysis/exercise-configs';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
}

const ExercisesList: React.FC = () => {
  const { muscleGroupId } = useParams<{ muscleGroupId: string }>();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Sample exercises for each muscle group
  useEffect(() => {
    // In a real app, this would be fetched from an API
    const exercisesByGroup: Record<string, Exercise[]> = {
      legs: [
        { 
          id: 'squat', 
          name: 'Agachamento', 
          description: 'Trabalha quadríceps, glúteos e core', 
          muscleGroup: 'legs',
          level: 'iniciante'
        },
        { 
          id: 'lunge', 
          name: 'Avanço', 
          description: 'Trabalha quadríceps, glúteos e equilíbrio', 
          muscleGroup: 'legs',
          level: 'intermediario'
        },
        { 
          id: 'calfRaises', 
          name: 'Elevação de Panturrilha', 
          description: 'Trabalha a musculatura da panturrilha', 
          muscleGroup: 'legs',
          level: 'iniciante'
        },
        { 
          id: 'jumpSquat', 
          name: 'Agachamento com Salto', 
          description: 'Trabalha quadríceps, glúteos e potência', 
          muscleGroup: 'legs',
          level: 'avancado'
        }
      ],
      arms: [
        { 
          id: 'curl', 
          name: 'Rosca Bíceps', 
          description: 'Trabalha bíceps e antebraços', 
          muscleGroup: 'arms',
          level: 'iniciante'
        },
        // ... other arm exercises
      ],
      // ... other muscle groups
    };
    
    // Set exercises for the current muscle group or default to legs
    setExercises(exercisesByGroup[muscleGroupId || 'legs'] || exercisesByGroup.legs);
  }, [muscleGroupId]);

  const handleExerciseSelect = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    localStorage.setItem("selectedExercise", exerciseId);
    toast({
      title: "Exercício selecionado",
      description: `Você selecionou ${exercises.find(e => e.id === exerciseId)?.name}.`,
      duration: 1500,
    });
  };

  const handleNext = () => {
    if (selectedExercise) {
      navigate(`/workout/exercise/${selectedExercise}`);
    } else {
      toast({
        title: "Selecione um exercício",
        description: "Escolha um exercício para continuar.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Get the display name for the muscle group
  const getMuscleGroupName = () => {
    const groups: Record<string, string> = {
      legs: 'Pernas',
      arms: 'Braços',
      chest: 'Peito',
      abs: 'Abdômen',
      back: 'Costas',
      fullbody: 'Corpo Todo'
    };
    
    return groups[muscleGroupId || 'legs'] || 'Exercícios';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="formfit-heading text-center flex-1">Exercícios para {getMuscleGroupName()}</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exercises.map((exercise) => (
              <Card 
                key={exercise.id}
                className={`cursor-pointer transition-shadow duration-300 ${
                  selectedExercise === exercise.id 
                    ? 'ring-2 ring-formfit-blue shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleExerciseSelect(exercise.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{exercise.name}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      exercise.level === 'iniciante' 
                        ? 'bg-green-100 text-green-800' 
                        : exercise.level === 'intermediario'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {exercise.level === 'iniciante' 
                        ? 'Iniciante' 
                        : exercise.level === 'intermediario' 
                          ? 'Intermediário' 
                          : 'Avançado'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {exercise.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex justify-end">
                  {selectedExercise === exercise.id && (
                    <div className="text-formfit-blue flex items-center">
                      <span>Selecionado</span>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 flex justify-center">
            <Button 
              onClick={handleNext}
              className="bg-formfit-blue hover:bg-formfit-blue/90 text-white font-medium px-8 py-6 rounded-lg text-lg"
              size="lg"
              disabled={!selectedExercise}
            >
              Ver Demonstração <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExercisesList;
