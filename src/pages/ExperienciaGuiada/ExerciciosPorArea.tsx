
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Home } from 'lucide-react';

const ExerciciosPorArea: React.FC = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const loginStatus = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(loginStatus === "true");
  }, []);
  
  const handleBack = () => {
    navigate('/experiencia-guiada');
  };
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  const exercises = {
    pernas: [
      { 
        id: 'agachamento',
        name: 'Agachamento',
        description: 'Exercício básico para quadríceps, glúteos e posterior de coxa',
        image: '🏋️‍♀️',
        available: true
      },
      { 
        id: 'afundo',
        name: 'Avanço',
        description: 'Fortalece quadríceps, glúteos e isquiotibiais',
        image: '🏃‍♀️',
        available: isLoggedIn // Available if logged in
      },
      { 
        id: 'leg-press',
        name: 'Leg Press',
        description: 'Trabalha quadríceps, glúteos e posterior de coxa',
        image: '💪',
        available: isLoggedIn // Available if logged in
      },
      { 
        id: 'cadeira-extensora',
        name: 'Cadeira Extensora',
        description: 'Isola e fortalece o quadríceps',
        image: '🦵',
        available: isLoggedIn // Available if logged in
      }
    ],
    braco: [
      { 
        id: 'curl',
        name: 'Rosca Bíceps',
        description: 'Exercício para fortalecer os bíceps',
        image: '💪',
        available: isLoggedIn
      },
      { 
        id: 'triceps',
        name: 'Extensão de Tríceps',
        description: 'Trabalha o tríceps e estabilizadores',
        image: '🏋️',
        available: isLoggedIn
      }
    ],
    peito: [
      { 
        id: 'pushup',
        name: 'Flexão de Braço',
        description: 'Exercício completo para peitoral e tríceps',
        image: '🏋️‍♂️',
        available: isLoggedIn
      }
    ],
    costas: [
      { 
        id: 'remada',
        name: 'Remada',
        description: 'Exercício para fortalecer as costas',
        image: '🏊‍♂️',
        available: isLoggedIn
      }
    ],
    abdomen: [
      { 
        id: 'abdominal',
        name: 'Abdominal',
        description: 'Exercício para fortalecer o core',
        image: '🧘‍♀️',
        available: isLoggedIn
      }
    ]
  };
  
  const currentExercises = areaId && areaId in exercises ? exercises[areaId as keyof typeof exercises] : [];
  const areaName = areaId === 'pernas' ? 'Pernas' : 
                 areaId === 'braco' ? 'Braços' : 
                 areaId === 'peito' ? 'Peito' : 
                 areaId === 'costas' ? 'Costas' : 
                 areaId === 'abdomen' ? 'Abdômen' : '';

  // Function to handle exercise click - directly go to workout execution
  const handleExerciseClick = (exerciseId: string) => {
    // Store the exercise ID for the workout page
    localStorage.setItem("currentExercise", JSON.stringify({
      id: exerciseId,
      name: currentExercises.find(ex => ex.id === exerciseId)?.name || "Exercício",
      muscles: areaId || ""
    }));
    
    // Navigate directly to the workout execution page
    navigate(`/workout/exercise/${exerciseId}`);
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
            <h1 className="formfit-heading text-center flex-1">Exercícios para {areaName}</h1>
            {isLoggedIn && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleGoToDashboard}
                className="ml-2"
              >
                <Home className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          <div className="space-y-4 max-w-md mx-auto">
            {currentExercises.map((exercise) => (
              <div 
                key={exercise.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-blue-500"
              >
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{exercise.image}</div>
                      <div>
                        <h3 className="font-semibold text-lg">{exercise.name}</h3>
                        <p className="text-gray-600 text-sm">{exercise.description}</p>
                      </div>
                    </div>
                    
                    {exercise.available ? (
                      <Button 
                        onClick={() => handleExerciseClick(exercise.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-medium transition-colors"
                      >
                        Iniciar
                      </Button>
                    ) : (
                      <div className="bg-gray-300 px-3 py-2 rounded-lg flex items-center gap-1">
                        <Lock className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600 text-sm font-medium">Bloqueado</span>
                      </div>
                    )}
                  </div>
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

export default ExerciciosPorArea;
