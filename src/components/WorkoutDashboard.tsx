import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart2, X } from 'lucide-react';

interface WorkoutDashboardProps {
  count: number;
  timer: number;
  feedback: string;
  poseFeedback: string;
  isPaused: boolean;
  showStats: boolean;
  onShowStats: () => void;
}

const WorkoutDashboard: React.FC<WorkoutDashboardProps> = ({
  count,
  timer,
  feedback,
  poseFeedback,
  isPaused,
  showStats,
  onShowStats
}) => {
  // Memoized formatted time
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timer]);

  // Memoized stats panel
  const statsPanel = useMemo(() => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Estatísticas do Treino</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowStats}
          className="hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Tempo Total</p>
          <p className="text-2xl font-bold">{formattedTime}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Repetições</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
      </div>
    </div>
  ), [formattedTime, count, onShowStats]);

  // Memoized feedback panel
  const feedbackPanel = useMemo(() => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Feedback</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Status do Exercício</p>
          <p className={`text-lg ${isPaused ? 'text-yellow-500' : 'text-green-500'}`}>
            {isPaused ? 'Pausado' : 'Em Progresso'}
          </p>
        </div>
        
        {poseFeedback && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Feedback da Pose</p>
            <p className="text-lg">{poseFeedback}</p>
          </div>
        )}
        
        {feedback && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Feedback Geral</p>
            <p className="text-lg">{feedback}</p>
          </div>
        )}
      </div>
    </div>
  ), [isPaused, poseFeedback, feedback]);

  return (
    <div className="space-y-4">
      {showStats ? statsPanel : (
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold">
            {formattedTime}
          </div>
          <Button
            variant="outline"
            onClick={onShowStats}
            className="flex items-center gap-2"
          >
            <BarChart2 className="h-5 w-5" />
            Ver Estatísticas
          </Button>
        </div>
      )}
      
      {feedbackPanel}
    </div>
  );
};

export default WorkoutDashboard;
