
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Workout from "./pages/Workout";
import NotFound from "./pages/NotFound";

// Onboarding Flow
import LevelSelection from "./pages/OnboardingFlow/LevelSelection";
import UserProfile from "./pages/OnboardingFlow/UserProfile";
import TrainingAvailability from "./pages/OnboardingFlow/TrainingAvailability";
import UserRegistration from "./pages/OnboardingFlow/UserRegistration";

// Workout Flow
import MuscleGroups from "./pages/WorkoutFlow/MuscleGroups";
import ExercisesList from "./pages/WorkoutFlow/ExercisesList";
import ExerciseExecution from "./pages/WorkoutFlow/ExerciseExecution";
import WorkoutSummary from "./pages/WorkoutFlow/WorkoutSummary";

// New subscription page
import Subscription from "./pages/Subscription";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/workout" element={<Workout />} />
          
          {/* Onboarding Flow */}
          <Route path="/onboarding" element={<LevelSelection />} />
          <Route path="/onboarding/level" element={<LevelSelection />} />
          <Route path="/onboarding/profile" element={<UserProfile />} />
          <Route path="/onboarding/availability" element={<TrainingAvailability />} />
          <Route path="/onboarding/registration" element={<UserRegistration />} />
          
          {/* Workout Flow */}
          <Route path="/workout/muscle-groups" element={<MuscleGroups />} />
          <Route path="/workout/guided/muscle-groups" element={<MuscleGroups />} />
          <Route path="/workout/exercises/:muscleGroupId" element={<ExercisesList />} />
          <Route path="/workout/exercise/:exerciseId" element={<ExerciseExecution />} />
          <Route path="/workout/summary" element={<WorkoutSummary />} />
          
          {/* Subscription page */}
          <Route path="/subscription" element={<Subscription />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
