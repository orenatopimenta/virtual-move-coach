
import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from 'lucide-react';

const ExerciciosPorArea: React.FC = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/experiencia-guiada');
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
        available: false
      },
      { 
        id: 'leg-press',
        name: 'Leg Press',
        description: 'Trabalha quadríceps, glúteos e posterior de coxa',
        image: '💪',
        available: false
      },
      { 
        id: 'cadeira-extensora',
        name: 'Cadeira Extensora',
        description: 'Isola e fortalece o quadríceps',
        image: '🦵',
        available: false
      }
    ],
    braco: [],
    peito: [],
    costas: [],
    abdomen: []
  };
  
  const currentExercises = areaId && areaId in exercises ? exercises[areaId as keyof typeof exercises] : [];
  const areaName = areaId === 'pernas' ? 'Pernas' : 
                 areaId === 'braco' ? 'Braços' : 
                 areaId === 'peito' ? 'Peito' : 
                 areaId === 'costas' ? 'Costas' : 
                 areaId === 'abdomen' ? 'Abdômen' : '';

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
                      <Link 
                        to={`/workout?exercise=${exercise.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Iniciar
                      </Link>
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
