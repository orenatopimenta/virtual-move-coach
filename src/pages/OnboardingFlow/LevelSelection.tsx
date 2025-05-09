
import React from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LevelSelection: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = React.useState<string>("iniciante");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    toast({
      title: "Nível selecionado",
      description: `Você selecionou o nível ${level}.`,
      duration: 1500,
    });
  };

  const handleNext = () => {
    if (selectedLevel) {
      localStorage.setItem("userLevel", selectedLevel);
      navigate("/onboarding/profile");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <h1 className="formfit-heading text-center mb-8">Qual é o seu nível?</h1>
          
          <div className="space-y-4 max-w-md mx-auto">
            <button 
              onClick={() => handleLevelSelect("iniciante")}
              className={`w-full p-4 rounded-lg flex items-center justify-between ${selectedLevel === "iniciante" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              <span className="font-medium text-lg">🟩 Iniciante</span>
              {selectedLevel === "iniciante" && <Check className="h-5 w-5" />}
            </button>
            
            <button 
              onClick={() => handleLevelSelect("intermediario")}
              className={`w-full p-4 rounded-lg flex items-center justify-between ${selectedLevel === "intermediario" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              <span className="font-medium text-lg">🟥 Intermediário</span>
              {selectedLevel === "intermediario" && <Check className="h-5 w-5" />}
            </button>
            
            <button 
              onClick={() => handleLevelSelect("avancado")}
              className={`w-full p-4 rounded-lg flex items-center justify-between ${selectedLevel === "avancado" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              <span className="font-medium text-lg">🟥 Avançado</span>
              {selectedLevel === "avancado" && <Check className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="mt-12 flex justify-center">
            <Button 
              onClick={handleNext}
              className="bg-formfit-blue hover:bg-formfit-blue/90 text-white font-medium px-8 py-6 rounded-lg text-lg"
              size="lg"
            >
              Avançar <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LevelSelection;
