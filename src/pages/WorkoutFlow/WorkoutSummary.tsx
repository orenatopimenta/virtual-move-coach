
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Check, AlertTriangle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RepStats {
  total: number;
  good: number;
  average: number;
  poor: number;
}

interface SummaryState {
  elapsedTime: number;
  series: number;
  repStats: RepStats;
}

const WorkoutSummary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state or use defaults
  const { elapsedTime = 0, series = 0, repStats = { total: 0, good: 0, average: 0, poor: 0 } } = 
    (location.state as SummaryState) || {};
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const calculatePercentage = (value: number): number => {
    return repStats.total > 0 ? Math.round((value / repStats.total) * 100) : 0;
  };
  
  const getRecommendation = (): string => {
    const goodPercentage = calculatePercentage(repStats.good);
    
    if (goodPercentage >= 80) {
      return "Excelente desempenho! Continue com exercícios mais desafiadores.";
    } else if (goodPercentage >= 60) {
      return "Bom trabalho! Concentre-se em melhorar a técnica.";
    } else {
      return "Considere reduzir a intensidade e focar na técnica correta.";
    }
  };
  
  const handleGoToHistory = () => {
    // In a real app, this would go to a history page
    // For now, just go back to muscle groups
    navigate('/workout/muscle-groups');
  };
  
  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <div className="flex items-center mb-6">
            <button 
              onClick={handleGoToHome}
              className="mr-3 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="formfit-heading">Resumo do Treino</h1>
          </div>
          
          <div className="space-y-6 max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" /> Estatísticas do Treino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Tempo Total</div>
                    <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Séries Completadas</div>
                    <div className="text-2xl font-bold">{series}/3</div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Repetições Totais</div>
                    <div className="text-2xl font-bold">{repStats.total}</div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Calorias (est.)</div>
                    <div className="text-2xl font-bold">{Math.round(elapsedTime * 0.15)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Qualidade das Repetições</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-green-500 p-1 rounded-full mr-2">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <span>Corretas</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold mr-2">{repStats.good}</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${calculatePercentage(repStats.good)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-yellow-500 p-1 rounded-full mr-2">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <span>Aceitáveis</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold mr-2">{repStats.average}</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500"
                          style={{ width: `${calculatePercentage(repStats.average)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-red-500 p-1 rounded-full mr-2">
                        <X className="h-4 w-4 text-white" />
                      </div>
                      <span>Incorretas</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold mr-2">{repStats.poor}</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500"
                          style={{ width: `${calculatePercentage(repStats.poor)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="font-medium mb-1">Recomendação</h3>
                  <p className="text-sm">{getRecommendation()}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center space-x-4 mt-8">
              <Button
                onClick={handleGoToHistory}
                className="bg-formfit-blue hover:bg-formfit-blue/90"
              >
                Ver Histórico
              </Button>
              
              <Button
                onClick={handleGoToHome}
                variant="outline"
              >
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WorkoutSummary;
