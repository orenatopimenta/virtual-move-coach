
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";

const TrainingAvailability: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const weekdays = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo"
  ];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleNext = () => {
    if (selectedDays.length === 0) {
      toast({
        title: "Selecione pelo menos um dia",
        description: "Precisamos saber quando você pode treinar.",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem("trainingDays", JSON.stringify(selectedDays));
    navigate("/workout/muscle-groups");
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
            <h1 className="formfit-heading text-center flex-1">Em quais dias você pode treinar?</h1>
          </div>
          
          <div className="space-y-4 max-w-md mx-auto">
            {weekdays.map((day) => (
              <div key={day} className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm">
                <Checkbox
                  id={day}
                  checked={selectedDays.includes(day)}
                  onCheckedChange={() => toggleDay(day)}
                  className="h-5 w-5 border-2"
                />
                <label
                  htmlFor={day}
                  className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {day}
                </label>
              </div>
            ))}
          </div>
          
          <div className="mt-12 flex justify-center">
            <Button 
              onClick={handleNext}
              className="bg-formfit-blue hover:bg-formfit-blue/90 text-white font-medium px-8 py-6 rounded-lg text-lg"
              size="lg"
            >
              Próximo <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrainingAvailability;
