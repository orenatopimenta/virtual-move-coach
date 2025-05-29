import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Dumbbell, Users, Heart, Coffee } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const MuscleGroups: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showPaywallDialog, setShowPaywallDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Check if we're in guided experience mode
  const isGuidedExperience = location.pathname.includes('guided') || 
                             localStorage.getItem('experienceMode') === 'guided';

  const muscleGroups = [
    {
      id: 'legs',
      name: 'Pernas',
      description: 'Exercícios para quádriceps, posteriores e panturrilhas',
      icon: <Users className="h-12 w-12 text-formfit-blue" />,
      free: true
    },
    {
      id: 'arms',
      name: 'Braços',
      description: 'Exercícios para bíceps, tríceps e antebraços',
      icon: <Dumbbell className="h-12 w-12 text-formfit-purple" />,
      free: false
    },
    {
      id: 'shoulders',
      name: 'Ombros',
      description: 'Exercícios para deltoides e ombros',
      icon: <Dumbbell className="h-12 w-12 text-yellow-400" />,
      free: true
    },
    {
      id: 'chest',
      name: 'Peito',
      description: 'Exercícios para peitoral e ombros',
      icon: <Heart className="h-12 w-12 text-formfit-pink" />,
      free: false
    },
    {
      id: 'abs',
      name: 'Abdômen',
      description: 'Exercícios para região abdominal',
      icon: <Coffee className="h-12 w-12 text-formfit-green" />,
      free: false
    },
    {
      id: 'back',
      name: 'Costas',
      description: 'Exercícios para trapézio e lombar',
      icon: <Dumbbell className="h-12 w-12 text-formfit-orange" />,
      free: false
    },
    {
      id: 'fullbody',
      name: 'Corpo Todo',
      description: 'Exercícios completos para todos os grupos musculares',
      icon: <Users className="h-12 w-12 text-formfit-blue" />,
      free: false
    }
  ];

  const handleGroupSelect = (groupId: string, isFree: boolean) => {
    // If in guided experience and not free, show paywall
    if (isGuidedExperience && !isFree) {
      setShowPaywallDialog(true);
      return;
    }
    
    setSelectedGroup(groupId);
    localStorage.setItem("selectedMuscleGroup", groupId);
    toast({
      title: "Grupo muscular selecionado",
      description: `Você selecionou ${muscleGroups.find(g => g.id === groupId)?.name}.`,
      duration: 1500,
    });
    
    navigate(`/workout/exercises/${groupId}`);
  };

  const handleBack = () => {
    navigate(-1);
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
            <h1 className="formfit-heading text-center flex-1">Quais áreas você quer treinar?</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {muscleGroups.map((group) => (
              <Card 
                key={group.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow duration-300 ${
                  isGuidedExperience && !group.free ? 'relative' : ''
                }`}
                onClick={() => handleGroupSelect(group.id, group.free)}
              >
                {isGuidedExperience && !group.free && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold">
                    Premium
                  </div>
                )}
                <CardHeader className="flex flex-col items-center">
                  {group.icon}
                  <CardTitle className="mt-4">{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {group.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />

      {/* Paywall dialog */}
      <Dialog open={showPaywallDialog} onOpenChange={setShowPaywallDialog}>
        <DialogContent>
          <DialogTitle>Conteúdo Premium</DialogTitle>
          <DialogDescription>
            Este tipo de treino está disponível apenas para assinantes. Assine agora para acessar todos os nossos treinos personalizados.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaywallDialog(false)}>
              Fechar
            </Button>
            <Button onClick={() => navigate("/subscription")}>
              Assinar Já
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MuscleGroups;
