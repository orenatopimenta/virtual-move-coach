
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DashboardProps {
  elapsedTime: number;
  repStats: {
    total: number;
    good: number;
    average: number;
    poor: number;
  };
  series: number;
}

const WorkoutDashboard: React.FC<DashboardProps> = ({ elapsedTime, repStats, series }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate percentages for the performance chart
  const goodPercentage = repStats.total > 0 ? (repStats.good / repStats.total) * 100 : 0;
  const averagePercentage = repStats.total > 0 ? (repStats.average / repStats.total) * 100 : 0;
  const poorPercentage = repStats.total > 0 ? (repStats.poor / repStats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Treino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Séries Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{series}/3</div>
            <Progress 
              value={series * 33.33} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Repetições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repStats.total}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Qualidade das Repetições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                <span>Boa execução</span>
              </div>
              <span className="font-medium">{repStats.good} ({Math.round(goodPercentage)}%)</span>
            </div>
            <Progress value={goodPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-green-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
                <span>Execução razoável</span>
              </div>
              <span className="font-medium">{repStats.average} ({Math.round(averagePercentage)}%)</span>
            </div>
            <Progress value={averagePercentage} className="h-2 bg-gray-200" indicatorClassName="bg-yellow-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
                <span>Execução a melhorar</span>
              </div>
              <span className="font-medium">{repStats.poor} ({Math.round(poorPercentage)}%)</span>
            </div>
            <Progress value={poorPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linha do Tempo do Treino</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              {/* Timeline markers */}
              <div className="flex h-full">
                <div className="bg-green-500 h-full" style={{ width: `${goodPercentage}%` }}></div>
                <div className="bg-yellow-500 h-full" style={{ width: `${averagePercentage}%` }}></div>
                <div className="bg-red-500 h-full" style={{ width: `${poorPercentage}%` }}></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Início</span>
              <span>{formatTime(Math.floor(elapsedTime / 2))}</span>
              <span>Final</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutDashboard;
