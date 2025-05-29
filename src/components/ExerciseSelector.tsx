import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BicepsFlexed, Dumbbell } from 'lucide-react';
import { User } from 'lucide-react';  // Replacing 'body' with 'User' icon

interface ExerciseOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: string) => void;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onSelectExercise }) => {
  const exercises: ExerciseOption[] = [
    {
      id: 'squat',
      name: 'Agachamento',
      description: 'Posicione seus pés na largura dos ombros e agache mantendo a postura reta.',
      icon: <User className="h-12 w-12 text-formfit-blue" />
    },
    {
      id: 'afundo',
      name: 'Avanço',
      description: 'Dê um passo à frente e agache, mantendo o tronco ereto.',
      icon: <User className="h-12 w-12 text-formfit-blue" />
    },
    {
      id: 'push-up',
      name: 'Flexão de Braço',
      description: 'Mantenha o corpo alinhado e dobre os cotovelos para descer.',
      icon: <BicepsFlexed className="h-12 w-12 text-formfit-purple" />
    },
    {
      id: 'biceps-curl',
      name: 'Rosca Bíceps',
      description: 'Segure pesos leves e dobre os cotovelos para trabalhar os bíceps.',
      icon: <Dumbbell className="h-12 w-12 text-formfit-pink" />
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="formfit-subheading text-center">Escolha um exercício para começar</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exercises.map((exercise) => (
          <Card 
            key={exercise.id}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => onSelectExercise(exercise.id)}
          >
            <CardHeader className="flex flex-col items-center">
              {exercise.icon}
              <CardTitle className="mt-4">{exercise.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                {exercise.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExerciseSelector;
