import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dumbbell, Heart, Activity } from 'lucide-react';

interface ExerciseSelectorProps {
  onSelect: (exercise: string) => void;
}

const exercises = [
  {
    id: 'squat',
    name: 'Agachamento',
    icon: Dumbbell,
    description: 'Exercício para fortalecer pernas e glúteos',
    category: 'Força'
  },
  {
    id: 'pushup',
    name: 'Flexão',
    icon: Activity,
    description: 'Exercício para fortalecer peito, ombros e tríceps',
    category: 'Força'
  },
  {
    id: 'bicepcurl',
    name: 'Rosca Bíceps',
    icon: Dumbbell,
    description: 'Exercício para fortalecer bíceps',
    category: 'Força'
  },
  {
    id: 'plank',
    name: 'Prancha',
    icon: Activity,
    description: 'Exercício para fortalecer core e abdômen',
    category: 'Core'
  },
  {
    id: 'lunge',
    name: 'Afundo',
    icon: Activity,
    description: 'Exercício para fortalecer pernas e equilíbrio',
    category: 'Força'
  }
];

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onSelect }) => {
  // Memoized exercise cards
  const exerciseCards = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exercises.map((exercise) => {
        const Icon = exercise.icon;
        return (
          <Button
            key={exercise.id}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-gray-50"
            onClick={() => onSelect(exercise.id)}
          >
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <span className="font-medium">{exercise.name}</span>
            </div>
            <p className="text-sm text-gray-500 text-left">{exercise.description}</p>
            <span className="text-xs text-gray-400">{exercise.category}</span>
          </Button>
        );
      })}
    </div>
  ), [onSelect]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Selecione um Exercício</h2>
        <div className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-red-500" />
          <span className="text-sm text-gray-500">Exercícios Recomendados</span>
        </div>
      </div>
      
      {exerciseCards}
    </div>
  );
};

export default ExerciseSelector;
