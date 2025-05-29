import React, { useRef, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import FormFitHeader from '@/components/FormFitHeader';
import PoseDetection from '@/components/PoseDetection';
import ExerciseSelector from '@/components/ExerciseSelector';
import ExerciseAnimation from '@/components/ExerciseAnimation';
import WorkoutDashboard from '@/components/WorkoutDashboard';
import Footer from '@/components/Footer';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { Button } from '@/components/ui/button';
import { Camera, Play, Pause, BarChart2 } from 'lucide-react';
import { saveWorkoutToSupabase } from '@/lib/saveWorkoutToSupabase';
import { supabase } from '@/lib/supabaseClient';
import { MODELOS } from './TreinoIA';
import deburr from 'lodash/deburr';

// Lista de referência de todos os exercícios usados no app
const TODOS_EXERCICIOS = [
  { id: 'squat', name: 'Agachamento' },
  { id: 'agachamento', name: 'Agachamento' },
  { id: 'push-up', name: 'Flexão de Braço' },
  { id: 'pushup', name: 'Flexão de Braço' },
  { id: 'flexao', name: 'Flexão de Braço' },
  { id: 'biceps-curl', name: 'Rosca Bíceps' },
  { id: 'curl', name: 'Rosca Bíceps' },
  { id: 'afundo', name: 'Avanço' },
  { id: 'leg-press', name: 'Leg Press' },
  { id: 'cadeira-extensora', name: 'Cadeira Extensora' },
  { id: 'hammer-curl', name: 'Rosca Hammer' },
  { id: 'triceps', name: 'Extensão de Tríceps' },
  { id: 'rosca-triceps', name: 'Rosca Tríceps' },
  { id: 'supino', name: 'Supino' },
  { id: 'crossover', name: 'Crossover' },
  { id: 'crossover-baixo', name: 'Crossover Baixo' },
  { id: 'remada', name: 'Remada' },
  { id: 'lat-push', name: 'Lat Push' },
  { id: 'lat-pull', name: 'Lat Pull' },
  { id: 'seated-row', name: 'Seated Row' },
  { id: 'abdominal', name: 'Abdominal' },
  { id: 'levantamento-lateral', name: 'Levantamento Lateral' },
  { id: 'levantamento-frontal', name: 'Levantamento Frontal' },
  { id: 'desenvolvimento', name: 'Desenvolvimento' },
  { id: 'crucifixo-invertido', name: 'Crucifixo Invertido' },
];

const Workout: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [exerciseStats, setExerciseStats] = useState({
    repetitions: 0,
    series: 0,
    quality: { good: 0, average: 0, poor: 0 }
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { toast } = useToast();
  const timerRef = useRef<number | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]); // [{ name, sets: [{...}] }]
  const [modalExecucao, setModalExecucao] = useState<{exercicio: string} | null>(null);
  const [modalModelo, setModalModelo] = useState(MODELOS[0]);
  const [modalCarga, setModalCarga] = useState(0);
  const [modalSemCarga, setModalSemCarga] = useState(true);

  // Start the timer when we begin analysis
  useEffect(() => {
    if (isAnalyzing && !timerRef.current) {
      const startTime = Date.now() - (elapsedTime * 1000); // Account for previous time
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (!isAnalyzing && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAnalyzing, elapsedTime]);

  const handleExerciseSelect = (exercise: string) => {
    setModalExecucao({ exercicio: exercise });
    setModalModelo(MODELOS[0]);
    setModalCarga(0);
    setModalSemCarga(true);
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setIsAnalyzing(true);
    toast({
      title: "Análise iniciada",
      description: "Posicione-se na frente da câmera e comece o exercício.",
      duration: 3000,
    });
  };

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    toast({
      title: "Análise iniciada",
      description: "Posicione-se na frente da câmera e comece o exercício.",
      duration: 3000,
    });
  };

  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
    toast({
      title: "Análise pausada",
      description: "Você pode retomar quando estiver pronto.",
      duration: 3000,
    });
  };

  const handleToggleDashboard = () => {
    setShowDashboard(prev => !prev);
  };

  // Função de callback para contabilizar repetições
  const handleRepetitionCounted = () => {
    console.log("🏋️ Repetição contabilizada no Workout.tsx!");
    setExerciseStats(prev => {
      // Randomly assign quality for demo purposes - in real app would be based on exercise quality
      const qualities = ['good', 'average', 'poor'];
      const qualityIndex = Math.floor(Math.random() * 3);
      const quality = qualities[qualityIndex] as 'good' | 'average' | 'poor';
      
      const newQuality = {
        good: quality === 'good' ? prev.quality.good + 1 : prev.quality.good,
        average: quality === 'average' ? prev.quality.average + 1 : prev.quality.average,
        poor: quality === 'poor' ? prev.quality.poor + 1 : prev.quality.poor
      };
      
      const repetitions = prev.repetitions + 1;
      let series = prev.series;
      
      // Check if we should increment the series (e.g., every 10 reps)
      if (repetitions % 10 === 0 && repetitions > 0) {
        series += 1;
        toast({
          title: "Série Completa!",
          description: `Você completou ${series} séries de ${selectedExercise}`,
          duration: 3000,
          variant: "default",
        });
      }
      
      // Toast notification for the rep
      toast({
        title: "🏋️ Repetição!",
        description: `Repetição #${repetitions} contabilizada`,
        duration: 1000,
        variant: "default",
      });
      
      return {
        repetitions,
        series,
        quality: newQuality
      };
    });
  };

  const handleFeedback = (message: string) => {
    // Liste aqui todas as mensagens que você quer suprimir
    const mensagensIgnoradas = [
      "Afaste-se para a câmera ver suas pernas completas",
      "Posicione-se em frente à câmera",
      "Posicione-se para que seus braços estejam visíveis",
      "Posicione a câmera para ver seu tronco e braços completos",
      "Posicione a câmera lateralmente para ver seu corpo na horizontal"
    ];
    if (mensagensIgnoradas.some(m => message.includes(m))) return;
    setFeedback(message);
  };

  const handleSeriesComplete = () => {
    setWorkoutExercises(prev => prev.map(e =>
      e.name === selectedExercise
        ? { ...e, sets: [...e.sets, { seriesNumber: e.sets.length + 1, repetitions: exerciseStats.repetitions, completed: true, metrics: [] }] }
        : e
    ));
  };

  const handleFinishWorkout = async () => {
    console.log('Iniciando gravação do treino:', workoutExercises);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' });
      return;
    }
    try {
      await saveWorkoutToSupabase({
        userId: user.id,
        totalTime: Math.round(elapsedTime / 60),
        xp: workoutExercises.reduce((acc, ex) => acc + ex.sets.length * 10, 0),
        exercises: workoutExercises
      });
      console.log('Treino salvo com sucesso!');
      toast({ title: 'Treino salvo com sucesso!' });
      setWorkoutExercises([]);
      setSelectedExercise(null);
      setExerciseStats({ repetitions: 0, series: 0, quality: { good: 0, average: 0, poor: 0 } });
      setElapsedTime(0);
      setFeedback(null);
    } catch (err: any) {
      console.error('Erro ao salvar treino:', err);
      toast({ title: 'Erro ao salvar treino', description: err.message, variant: 'destructive' });
    }
  };

  const exerciseId = selectedExercise ? 
    selectedExercise.toLowerCase().replace(/\s+/g, '') : 'squat';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <h1 className="formfit-heading text-center flex-1">Seu Treino</h1>
          
          {!selectedExercise ? (
            <ExerciseSelector onSelectExercise={handleExerciseSelect} />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="formfit-subheading">{selectedExercise}</h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleToggleDashboard}
                    variant="outline"
                  >
                    <BarChart2 className="mr-2 h-4 w-4" />
                    {showDashboard ? 'Ocultar Dashboard' : 'Mostrar Dashboard'}
                  </Button>
                  <Button
                    onClick={() => setSelectedExercise(null)}
                    variant="outline"
                  >
                    Mudar exercício
                  </Button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-md h-[90vh]">
                <div className="h-full w-full rounded-lg overflow-hidden bg-gray-100 relative">
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

              {!showDashboard ? (
                <>
                  <div className="flex justify-center space-x-4">
                    {!isAnalyzing ? (
                      <Button 
                        onClick={handleStartAnalysis}
                        className="bg-formfit-blue hover:bg-formfit-blue/90"
                        size="lg"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        Iniciar
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleStopAnalysis}
                        variant="outline"
                        size="lg"
                      >
                        <Pause className="mr-2 h-5 w-5" />
                        Pausar
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-xl font-bold mb-2">Repetições</h3>
                      <div className="text-5xl font-bold text-formfit-blue">{exerciseStats.repetitions}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-xl font-bold mb-2">Feedback</h3>
                      <div className={`text-lg ${feedback?.includes('Correto') || feedback?.includes('Boa!') || feedback?.includes('Excelente') ? 'text-green-500' : feedback?.includes('Ruim') || feedback?.includes('Afaste') ? 'text-amber-500' : 'text-blue-500'}`}>
                        {(() => {
                          const mensagensIgnoradas = [
                            "Afaste-se para a câmera ver suas pernas completas",
                            "Posicione-se em frente à câmera",
                            "Posicione-se para que seus braços estejam visíveis",
                            "Posicione a câmera para ver seu tronco e braços completos",
                            "Posicione a câmera lateralmente para ver seu corpo na horizontal"
                          ];
                          if (!feedback || mensagensIgnoradas.some(m => feedback.includes(m))) return "Aguardando...";
                          return feedback;
                        })()}
                      </div>
                    </div>
                  </div>

                  {!showDashboard && selectedExercise && (
                    <Button onClick={handleFinishWorkout} className="w-full bg-green-600 hover:bg-green-700 mt-4">
                      Finalizar Treino
                    </Button>
                  )}
                </>
              ) : (
                <WorkoutDashboard
                  elapsedTime={elapsedTime}
                  repStats={{
                    total: exerciseStats.repetitions,
                    good: exerciseStats.quality.good,
                    average: exerciseStats.quality.average,
                    poor: exerciseStats.quality.poor
                  }}
                  series={exerciseStats.series}
                />
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />

      {/* Exercise Animation Overlay */}
      {showAnimation && selectedExercise && (
        <ExerciseAnimation 
          exerciseId={exerciseId}
          onComplete={handleAnimationComplete} 
        />
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
              <Button className="bg-formfit-blue hover:bg-formfit-blue/90" size="lg" onClick={() => {
                const normalize = (str) => deburr(str || '').toLowerCase();
                const exercicioObj = TODOS_EXERCICIOS.find(
                  e => normalize(e.id) === normalize(selectedExercise) || normalize(e.name) === normalize(selectedExercise)
                ) || { id: normalize(selectedExercise), name: selectedExercise };
                const toSave = {
                  id: exercicioObj.id,
                  name: exercicioObj.name,
                  modelo: modalModelo,
                  carga: modalSemCarga ? null : modalCarga,
                  muscles: ''
                };
                console.log('Salvando no localStorage:', toSave);
                localStorage.setItem("currentExercise", JSON.stringify(toSave));
                setModalExecucao(null);
                setIsAnalyzing(true);
              }}>
                <Play className="mr-2 h-5 w-5" />
                Iniciar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workout;
