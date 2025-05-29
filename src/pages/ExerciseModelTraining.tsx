
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Video, Play, Download, List, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExerciseModelUploader from '@/components/exercise-models/ExerciseModelUploader';
import ExerciseModelViewer from '@/components/exercise-models/ExerciseModelViewer';

const EXERCISE_TYPES = [
  { id: 'squat', name: 'Agachamento', description: 'Treino para pernas e glúteos' },
  { id: 'pushup', name: 'Flexão de Braço', description: 'Treino para peito e braços' },
  { id: 'curl', name: 'Rosca Bíceps', description: 'Treino para bíceps' },
  { id: 'lunge', name: 'Avanço', description: 'Treino para pernas e glúteos' },
  { id: 'plank', name: 'Prancha', description: 'Treino para core e abdômen' },
];

const ExerciseModelTraining: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("lista");

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setActiveTab("upload");
  };

  const handleBack = () => {
    if (selectedExercise) {
      setSelectedExercise(null);
    } else {
      navigate("/dashboard");
    }
  };

  const handleTrainModel = () => {
    toast({
      title: "Modelo sendo treinado",
      description: "O modelo de referência está sendo atualizado com os novos dados.",
    });
    // In a real implementation, this would trigger the model training process
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FormFitHeader />
      
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {selectedExercise 
              ? `Modelo de ${EXERCISE_TYPES.find(e => e.id === selectedExercise)?.name}` 
              : "Modelos de Exercícios"}
          </h1>
        </div>

        {!selectedExercise ? (
          <div className="grid grid-cols-1 gap-4">
            <p className="text-gray-600 mb-4">
              Selecione um exercício para gerenciar seu modelo de referência.
            </p>
            {EXERCISE_TYPES.map((exercise) => (
              <Card 
                key={exercise.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectExercise(exercise.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle>{exercise.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{exercise.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="lista" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="lista">
                <List className="h-4 w-4 mr-2" />
                Estatísticas
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="visualizar">
                <Video className="h-4 w-4 mr-2" />
                Visualizar
              </TabsTrigger>
              <TabsTrigger value="download">
                <Download className="h-4 w-4 mr-2" />
                Download
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="lista" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Modelo</CardTitle>
                  <CardDescription>
                    Detalhes sobre o modelo de referência atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Status:</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                        Ativo
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Vídeos de treinamento:</span>
                      <span>3</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Última atualização:</span>
                      <span>10/05/2025</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Precisão estimada:</span>
                      <span>87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upload" className="mt-0">
              <ExerciseModelUploader 
                exerciseId={selectedExercise} 
                onUploadComplete={() => {
                  toast({
                    title: "Upload concluído",
                    description: "Seu vídeo foi carregado e está pronto para ser processado."
                  });
                  setActiveTab("visualizar");
                }} 
              />
            </TabsContent>
            
            <TabsContent value="visualizar" className="mt-0">
              <ExerciseModelViewer 
                exerciseId={selectedExercise}
                onTrain={handleTrainModel} 
              />
            </TabsContent>
            
            <TabsContent value="download" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Download do Modelo</CardTitle>
                  <CardDescription>
                    Baixe o modelo de referência para uso local
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Você pode baixar o modelo de referência treinado para este exercício
                    para uso offline ou importação em outro sistema.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Modelo Completo</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-500">Inclui todas as métricas e dados de referência</p>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          Download (.json)
                        </Button>
                      </CardFooter>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Modelo Otimizado</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-500">Versão compacta para dispositivos móveis</p>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          Download (.lite)
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ExerciseModelTraining;
