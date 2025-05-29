import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Workout from './pages/Workout';
import Subscription from './pages/Subscription';
import TrainingAvailability from './pages/OnboardingFlow/TrainingAvailability';
import LevelSelection from './pages/OnboardingFlow/LevelSelection';
import UserProfile from './pages/OnboardingFlow/UserProfile';
import UserRegistration from './pages/OnboardingFlow/UserRegistration';
import GenderAndAge from './pages/OnboardingFlow/GenderAndAge';
import ExercisesList from './pages/WorkoutFlow/ExercisesList';
import ExerciseExecution from './pages/WorkoutFlow/ExerciseExecution';
import MuscleGroups from './pages/WorkoutFlow/MuscleGroups';
import WorkoutSummary from './pages/WorkoutFlow/WorkoutSummary';
import AreasDeExercicio from './pages/ExperienciaGuiada/AreasDeExercicio';
import ExerciciosPorArea from './pages/ExperienciaGuiada/ExerciciosPorArea';
import TreinoGuiadoAreas from './pages/TreinoGuiado/AreasDeExercicio';
import Login from './pages/Login';
import PrimeiroAcesso from './pages/PrimeiroAcesso';
import Dashboard from './pages/Dashboard';
import Cadastro from './pages/Cadastro';
import TreinoPersonalizado from './pages/ExperienciaGuiada/TreinoPersonalizado';
import MeusTreinos from './pages/MeusTreinos';
import TreinoPersonalizadoExecucao from './pages/ExperienciaGuiada/TreinoPersonalizadoExecucao';
import TreinoIA from './pages/TreinoIA';
import Perfil from './pages/Perfil';
import ParametrosTreino from './pages/ParametrosTreino';

import { Toaster } from '@/components/ui/toaster';
import './App.css';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Treinos */}
        <Route path="/treinos" element={<AreasDeExercicio />} />
        <Route path="/treinos/exercicios/:areaId" element={<ExerciciosPorArea />} />
        
        {/* Treino Guiado */}
        <Route path="/treino-guiado" element={<TreinoGuiadoAreas />} />
        <Route path="/treino-guiado/exercicios/:areaId" element={<ExerciciosPorArea />} />
        
        {/* Fluxo de Primeiro Acesso */}
        <Route path="/primeiro-acesso" element={<GenderAndAge />} />
        <Route path="/onboarding/availability" element={<TrainingAvailability />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Treino */}
        <Route path="/workout" element={<Workout />} />

        {/* Fluxo de Onboarding (existente) */}
        <Route path="/onboarding/level" element={<LevelSelection />} />
        <Route path="/onboarding/profile" element={<UserProfile />} />
        <Route path="/onboarding/registration" element={<UserRegistration />} />
        
        {/* Fluxo de treino (existente) */}
        <Route path="/workout-flow/muscle-groups" element={<MuscleGroups />} />
        <Route path="/workout-flow/exercises" element={<ExercisesList />} />
        <Route path="/workout-flow/execution" element={<ExerciseExecution />} />
        <Route path="/workout-flow/summary" element={<WorkoutSummary />} />
        
        {/* Assinatura */}
        <Route path="/subscription" element={<Subscription />} />
        
        <Route path="/workout/summary" element={<WorkoutSummary />} />
        
        <Route path="/cadastro" element={<Cadastro />} />
        
        <Route path="/treino-personalizado" element={<TreinoPersonalizado />} />
        
        <Route path="/meus-treinos" element={<MeusTreinos />} />
        
        <Route path="/treino-personalizado-execucao" element={<TreinoPersonalizadoExecucao />} />
        
        <Route path="/treino-ia" element={<TreinoIA />} />
        
        <Route path="/perfil" element={<Perfil />} />
        
        <Route path="/parametros-treino" element={<ParametrosTreino />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
