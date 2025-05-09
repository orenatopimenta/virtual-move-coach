
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
import ExercisesList from './pages/WorkoutFlow/ExercisesList';
import ExerciseExecution from './pages/WorkoutFlow/ExerciseExecution';
import MuscleGroups from './pages/WorkoutFlow/MuscleGroups';
import WorkoutSummary from './pages/WorkoutFlow/WorkoutSummary';

// Novas páginas 
import AreasDeExercicio from './pages/ExperienciaGuiada/AreasDeExercicio';
import ExerciciosPorArea from './pages/ExperienciaGuiada/ExerciciosPorArea';
import Login from './pages/Login';
import PrimeiroAcesso from './pages/PrimeiroAcesso';
import Dashboard from './pages/Dashboard';

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
        
        {/* Fluxo de Experiência Guiada */}
        <Route path="/experiencia-guiada" element={<AreasDeExercicio />} />
        <Route path="/experiencia-guiada/exercicios/:areaId" element={<ExerciciosPorArea />} />
        
        {/* Login e Cadastro */}
        <Route path="/login" element={<Login />} />
        <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
        <Route path="/dashboard" element={<Dashboard />} />
                
        {/* Treino */}
        <Route path="/workout" element={<Workout />} />

        {/* Fluxo de Onboarding (existente) */}
        <Route path="/onboarding" element={<TrainingAvailability />} />
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
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
