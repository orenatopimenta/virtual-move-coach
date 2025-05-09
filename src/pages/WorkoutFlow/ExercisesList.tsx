
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

interface ExerciseProgress {
  [exerciseId: string]: number; // Stores series progress (0-3)
}

interface ExerciseData {
  id: string;
  name: string;
  muscles: string;
}

const MuscleGroupExercises = {
  pernas: [
    { id: "squat", name: "Agachamento ao ar livre ou na parede", muscles: "pernas" },
    { id: "lunge", name: "Avanço parado", muscles: "pernas" },
    { id: "sumo", name: "Agachamento sumô", muscles: "pernas" },
    { id: "calf", name: "Elevação de panturrilha", muscles: "pernas" }
  ],
  peito: [
    { id: "pushup", name: "Flexão de braço", muscles: "peito" },
    { id: "dips", name: "Mergulho no banco", muscles: "peito" },
    { id: "incline", name: "Flexão inclinada", muscles: "peito" },
    { id: "flyes", name: "Crucifixo com elástico", muscles: "peito" }
  ],
  costas: [
    { id: "row", name: "Remada com elástico", muscles: "costas" },
    { id: "pullup", name: "Barra fixa", muscles: "costas" },
    { id: "superman", name: "Superman", muscles: "costas" },
    { id: "latpull", name: "Puxada com elástico", muscles: "costas" }
  ],
  ombro: [
    { id: "press", name: "Elevação lateral", muscles: "ombro" },
    { id: "frontrise", name: "Elevação frontal", muscles: "ombro" },
    { id: "shrugs", name: "Encolhimento de ombros", muscles: "ombro" },
    { id: "circle", name: "Círculos com os braços", muscles: "ombro" }
  ],
  "biceps-triceps": [
    { id: "curl", name: "Rosca direta", muscles: "biceps" },
    { id: "hammer", name: "Rosca martelo", muscles: "biceps" },
    { id: "tricepsext", name: "Extensão de tríceps", muscles: "triceps" },
    { id: "kickback", name: "Kickback de tríceps", muscles: "triceps" }
  ],
  abdomen: [
    { id: "crunch", name: "Abdominal simples", muscles: "abdomen" },
    { id: "plank", name: "Prancha", muscles: "abdomen" },
    { id: "legrise", name: "Elevação de pernas", muscles: "abdomen" },
    { id: "bicycle", name: "Bicicleta", muscles: "abdomen" }
  ],
};

const ExercisesList: React.FC = () => {
  const { muscleGroupId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [progress, setProgress] = useState<ExerciseProgress>({});
  
  useEffect(() => {
    // Get exercises for the selected muscle group
    const groupExercises = MuscleGroupExercises[muscleGroupId as keyof typeof MuscleGroupExercises] || [];
    setExercises(groupExercises);
    
    // Load progress from localStorage
    const savedProgress = localStorage.getItem(`progress_${muscleGroupId}`);
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, [muscleGroupId]);
  
  const getMuscleGroupName = (id: string): string => {
    const names: {[key: string]: string} = {
      "pernas": "Pernas",
      "peito": "Peito", 
      "costas": "Costas",
      "ombro": "Ombro",
      "biceps-triceps": "Bíceps/Tríceps",
      "abdomen": "Abdômen"
    };
    return names[id] || id;
  };
  
  const getStatusColor = (exerciseId: string): string => {
    const seriesCount = progress[exerciseId] || 0;
    
    if (seriesCount >= 3) return "bg-green-500"; // Completed all series
    if (seriesCount > 0) return "bg-yellow-500"; // In progress
    return "bg-gray-200"; // Not started
  };
  
  const handleSelectExercise = (exercise: ExerciseData) => {
    localStorage.setItem("currentExercise", JSON.stringify(exercise));
    navigate(`/workout/exercise/${exercise.id}`);
  };
  
  const handleBackToMuscleGroups = () => {
    navigate('/workout/muscle-groups');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <div className="flex items-center mb-6">
            <button 
              onClick={handleBackToMuscleGroups}
              className="mr-3 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="formfit-heading">Exercícios para {getMuscleGroupName(muscleGroupId)}</h1>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {exercises.map((exercise) => (
              <div 
                key={exercise.id}
                onClick={() => handleSelectExercise(exercise)}
                className={`${getStatusColor(exercise.id)} p-5 rounded-lg shadow-md flex flex-col items-center justify-between cursor-pointer hover:opacity-90 transition-opacity h-32`}
              >
                <span className="font-medium text-center">{exercise.name}</span>
                <div className="mt-4 text-xs font-bold bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {progress[exercise.id] || 0}/3 séries
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExercisesList;
