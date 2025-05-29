import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const TrainingAvailability: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const days = [
    { id: 'monday', label: 'Segunda-feira' },
    { id: 'tuesday', label: 'Terça-feira' },
    { id: 'wednesday', label: 'Quarta-feira' },
    { id: 'thursday', label: 'Quinta-feira' },
    { id: 'friday', label: 'Sexta-feira' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDays.length === 0) {
      toast({
        title: "Selecione pelo menos um dia",
        description: "Escolha os dias em que você pretende treinar",
        variant: "destructive"
      });
      return;
    }
    
    // Salvar dias selecionados no localStorage
    localStorage.setItem('trainingDays', JSON.stringify(selectedDays));
    
    // Navegar para a página de cadastro
    navigate('/cadastro');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow flex items-center justify-center py-8">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="formfit-heading text-center mb-6">Dias de Treino</h1>
          <p className="text-gray-600 text-center mb-6">
            Selecione os dias da semana em que você pretende treinar
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {days.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.id}
                    checked={selectedDays.includes(day.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDays([...selectedDays, day.id]);
                      } else {
                        setSelectedDays(selectedDays.filter(id => id !== day.id));
                      }
                    }}
                  />
                  <Label htmlFor={day.id}>{day.label}</Label>
                </div>
              ))}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-formfit-blue hover:bg-formfit-blue/90"
              disabled={selectedDays.length === 0}
            >
              Continuar
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrainingAvailability;
