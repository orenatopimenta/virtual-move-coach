import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Home } from 'lucide-react';
import { analyzeLateralRaise } from './pose-analysis/analyzeLateralRaise';
import EnhancedPoseDetection from '@/components/EnhancedPoseDetection';
import { Keypoint } from '@tensorflow-models/pose-detection';
import HeroSection from '@/components/HeroSection';
import { toast } from "@/components/ui/use-toast";
import { MODELOS } from '../TreinoIA';

const images = [
  "/images/modelo1.png",
  "/images/modelo2.png"
];

const ExerciciosPorArea: React.FC = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Estado para controlar o índice da imagem
  const [currentImage, setCurrentImage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutSaved, setWorkoutSaved] = useState(false);
  const [modalExecucao, setModalExecucao] = useState<{id: string, name: string} | null>(null);
  const [modalModelo, setModalModelo] = useState(MODELOS[0]);
  const [modalCarga, setModalCarga] = useState(0);
  const [modalSemCarga, setModalSemCarga] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const loginStatus = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(loginStatus === "true");
  }, []);
  
  // Efeito para trocar a imagem a cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const handleBack = () => {
    if (location.pathname.includes('treino-guiado')) {
      navigate('/treino-guiado');
    } else {
      navigate('/treinos');
    }
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
        available: location.pathname.includes('treino-guiado') ? false : true
      },
      { 
        id: 'leg-press',
        name: 'Leg Press',
        description: 'Trabalha quadríceps, glúteos e posterior de coxa',
        image: '💪',
        available: location.pathname.includes('treino-guiado') ? false : true
      },
      { 
        id: 'cadeira-extensora',
        name: 'Cadeira Extensora',
        description: 'Isola e fortalece o quadríceps',
        image: '🦵',
        available: location.pathname.includes('treino-guiado') ? false : true
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
        id: 'hammer-curl',
        name: 'Rosca Hammer',
        description: 'Exercício para bíceps e antebraço',
        image: '🔨',
        available: isLoggedIn
      },
      { 
        id: 'triceps',
        name: 'Extensão de Tríceps',
        description: 'Trabalha o tríceps e estabilizadores',
        image: '🏋️',
        available: isLoggedIn
      },
      {
        id: 'rosca-triceps',
        name: 'Rosca Tríceps',
        description: 'Exercício para fortalecer o tríceps',
        image: '💪',
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
      },
      {
        id: 'supino',
        name: 'Supino',
        description: 'Exercício clássico para peitoral',
        image: '🏋️',
        available: isLoggedIn
      },
      {
        id: 'crossover',
        name: 'Crossover',
        description: 'Exercício para peitoral com cabos',
        image: '🤸',
        available: isLoggedIn
      },
      {
        id: 'crossover-baixo',
        name: 'Crossover Baixo',
        description: 'Variação do crossover para parte inferior do peitoral',
        image: '🤸‍♂️',
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
      },
      {
        id: 'lat-push',
        name: 'Lat Push',
        description: 'Exercício para dorsais',
        image: '🏋️',
        available: isLoggedIn
      },
      {
        id: 'lat-pull',
        name: 'Lat Pull',
        description: 'Exercício para dorsais',
        image: '🏋️‍♂️',
        available: isLoggedIn
      },
      {
        id: 'seated-row',
        name: 'Seated Row',
        description: 'Remada sentada para costas',
        image: '🚣',
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
    ],
    ombros: [
      { 
        id: 'levantamento-lateral',
        name: 'Levantamento Lateral',
        description: 'Trabalha o deltoide lateral',
        image: '🏋️',
        available: true
      },
      { 
        id: 'levantamento-frontal',
        name: 'Levantamento Frontal',
        description: 'Trabalha o deltoide anterior',
        image: '🏋️',
        available: true
      },
      { 
        id: 'desenvolvimento',
        name: 'Desenvolvimento',
        description: 'Trabalha o deltoide e tríceps',
        image: '🏋️‍♂️',
        available: true
      },
      {
        id: 'crucifixo-invertido',
        name: 'Crucifixo Invertido',
        description: 'Exercício para deltoide posterior e parte superior das costas',
        image: '🦅',
        available: true
      }
    ]
  };
  
  const currentExercises = areaId && areaId in exercises ? exercises[areaId as keyof typeof exercises] : [];
  const areaName = areaId === 'pernas' ? 'Pernas' : 
                 areaId === 'braco' ? 'Braços' : 
                 areaId === 'peito' ? 'Peito' : 
                 areaId === 'costas' ? 'Costas' : 
                 areaId === 'abdomen' ? 'Abdômen' : 
                 areaId === 'ombros' ? 'Ombros' : '';

  // Function to handle exercise click - directly go to workout execution
  const handleExerciseClick = (exerciseId: string) => {
    const ex = currentExercises.find(ex => ex.id === exerciseId);
    setModalExecucao({ id: exerciseId, name: ex?.name || 'Exercício' });
    setModalModelo(MODELOS[0]);
    setModalCarga(0);
    setModalSemCarga(true);
  };

  const handleFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleRepetitionCounted = (count: number) => {
    // Implementation of handleRepetitionCounted
  };

  const handleRepIndicatorExtracted = (indicator?: RepIndicator) => {
    if (!indicator) return; // Não faz nada se vier undefined
    handleRepetitionCounted(indicator);
  };

  const handleSaveWorkout = async () => {
    if (workoutSaved || isSaving) return;
    setIsSaving(true);
    try {
      // ... salvar no supabase ...
      setWorkoutSaved(true);
      toast({ title: 'Treino salvo com sucesso!' });
    } catch (err) {
      // ... erro ...
    } finally {
      setIsSaving(false);
    }
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
                className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-blue-500 flex flex-col justify-between h-full"
              >
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 w-full">
                      <div className="text-2xl">{exercise.image}</div>
                      <div className="flex flex-col w-full">
                        <h3 className="font-semibold text-lg text-center w-full">{exercise.name}</h3>
                        <p className="text-gray-600 text-sm text-left w-full">{exercise.description}</p>
                      </div>
                    </div>
                    {exercise.available ? (
                      <button onClick={() => handleExerciseClick(exercise.id)}>
                        Iniciar
                      </button>
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
      {feedback && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded shadow-lg z-50">
          {feedback}
        </div>
      )}
      {modalExecucao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Configurar Execução</h2>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Modelo de treino</label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-formfit-blue"
                value={modalModelo}
                onChange={e => setModalModelo(e.target.value)}
              >
                {MODELOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Carga</label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (modalCarga > 0) setModalCarga(modalCarga - 1);
                    setModalSemCarga(false);
                  }}
                  disabled={modalSemCarga || modalCarga === 0}
                >
                  -
                </Button>
                <span className="text-2xl font-bold min-w-[3rem] text-center">{modalSemCarga ? 'Sem carga' : `${modalCarga} kg`}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => { setModalCarga(modalCarga + 1); setModalSemCarga(false); }}
                >
                  +
                </Button>
                <Button
                  type="button"
                  variant={modalSemCarga ? 'default' : 'outline'}
                  className={modalSemCarga ? 'bg-purple-600 text-white' : ''}
                  onClick={() => { setModalSemCarga(true); setModalCarga(0); }}
                >
                  Sem carga
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setModalExecucao(null)}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-bold" onClick={() => {
                localStorage.setItem("currentExercise", JSON.stringify({
                  id: modalExecucao.id,
                  name: modalExecucao.name,
                  modelo: modalModelo,
                  carga: modalSemCarga ? null : modalCarga,
                  muscles: areaId || ''
                }));
                setModalExecucao(null);
                navigate(`/workout-flow/execution`);
              }}>Iniciar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciciosPorArea;
