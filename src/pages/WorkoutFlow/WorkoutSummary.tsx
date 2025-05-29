import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Timer, Trophy, CheckCircle } from 'lucide-react';

interface WorkoutSummaryData {
  elapsedTime: number;
  series: number;
  repStats: {
    total: number;
    good: number;
    average: number;
    poor: number;
  };
}

const WorkoutSummary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const workoutData = location.state as WorkoutSummaryData;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateQuality = () => {
    if (!workoutData?.repStats) return 0;
    const { good, total } = workoutData.repStats;
    return total > 0 ? Math.round((good / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/treinos')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="formfit-heading text-center flex-1">Resumo do Treino</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-center mb-6">
              <Trophy className="h-12 w-12 text-yellow-500" />
            </div>
            
            <div className="space-y-6">
              {/* Tempo total */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Timer className="h-6 w-6 text-formfit-blue mr-3" />
                  <span className="font-medium">Tempo Total</span>
                </div>
                <span className="text-xl font-bold">{formatTime(workoutData?.elapsedTime || 0)}</span>
              </div>

              {/* Séries completadas */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="font-medium">Séries Completadas</span>
                </div>
                <span className="text-xl font-bold">{workoutData?.series || 0}/3</span>
              </div>

              {/* Repetições */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Repetições</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold">{workoutData?.repStats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">Boa execução</span>
                    <span className="font-bold">{workoutData?.repStats?.good || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-600">Execução média</span>
                    <span className="font-bold">{workoutData?.repStats?.average || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">Execução ruim</span>
                    <span className="font-bold">{workoutData?.repStats?.poor || 0}</span>
                  </div>
                </div>
              </div>

              {/* Qualidade geral */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Qualidade Geral</h3>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-formfit-blue h-4 rounded-full transition-all duration-500"
                    style={{ width: `${calculateQuality()}%` }}
                  ></div>
                </div>
                <div className="text-right mt-1">
                  <span className="text-sm font-medium">{calculateQuality()}%</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate('/treinos')}
            className="w-full bg-formfit-blue hover:bg-formfit-blue/90 text-white"
          >
            Voltar para Treinos
          </Button>
        </div>
      </main>
    </div>
  );
};

export default WorkoutSummary;
