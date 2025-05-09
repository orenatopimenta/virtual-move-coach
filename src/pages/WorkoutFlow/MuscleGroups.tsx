
import React from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Grid2X2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MuscleGroupCard {
  id: string;
  name: string;
  icon: React.ReactNode;
  bgColor: string;
}

const MuscleGroups: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const muscleGroups: MuscleGroupCard[] = [
    {
      id: "costas",
      name: "Costas",
      icon: <Grid2X2 className="h-10 w-10" />,
      bgColor: "bg-blue-500"
    },
    {
      id: "peito",
      name: "Peito",
      icon: <Grid2X2 className="h-10 w-10" />,
      bgColor: "bg-purple-500"
    },
    {
      id: "ombro",
      name: "Ombro",
      icon: <Grid2X2 className="h-10 w-10" />,
      bgColor: "bg-indigo-500"
    },
    {
      id: "pernas",
      name: "Pernas",
      icon: <Grid2X2 className="h-10 w-10" />,
      bgColor: "bg-green-500"
    },
    {
      id: "biceps-triceps",
      name: "Bíceps/Tríceps",
      icon: <Grid2X2 className="h-10 w-10" />,
      bgColor: "bg-yellow-500"
    },
    {
      id: "abdomen",
      name: "Abdômen",
      icon: <Grid2X2 className="h-10 w-10" />,
      bgColor: "bg-red-500"
    }
  ];

  const handleSelectMuscleGroup = (group: MuscleGroupCard) => {
    localStorage.setItem("selectedMuscleGroup", group.id);
    navigate(`/workout/exercises/${group.id}`);
    
    toast({
      title: `Grupo muscular: ${group.name}`,
      description: `Selecionando exercícios para ${group.name.toLowerCase()}`,
      duration: 1500,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <h1 className="formfit-heading text-center mb-8">Quais áreas você quer treinar?</h1>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {muscleGroups.map((group) => (
              <div 
                key={group.id}
                onClick={() => handleSelectMuscleGroup(group)}
                className={`${group.bgColor} text-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center space-y-2 hover:opacity-90 transition-opacity cursor-pointer h-32`}
              >
                {group.icon}
                <span className="font-medium text-lg text-center">{group.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MuscleGroups;
