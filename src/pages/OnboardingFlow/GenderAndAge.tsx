import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Minus, Plus, ArrowLeft } from 'lucide-react';

const GenderAndAge: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<number>(18);
  const navigate = useNavigate();

  const handleIncrement = () => {
    if (age < 120) {
      setAge(age + 1);
    }
  };

  const handleDecrement = () => {
    if (age > 1) {
      setAge(age - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Salvar dados no localStorage
    localStorage.setItem('userName', name);
    localStorage.setItem('userGender', gender);
    localStorage.setItem('userAge', age.toString());
    
    // Navegar para a próxima página
    navigate('/onboarding/availability');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow flex items-center justify-center py-8">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="mb-4 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <h1 className="formfit-heading text-center mb-6">Sobre você</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="name">Nome</Label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-formfit-blue"
                placeholder="Digite seu nome"
                required
              />
            </div>
            <div className="space-y-4">
              <Label>Gênero</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4 justify-center">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Masculino</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Feminino</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Outro</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Idade</Label>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleDecrement}
                  className="h-10 w-10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold min-w-[3rem] text-center">{age}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleIncrement}
                  className="h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-formfit-blue hover:bg-formfit-blue/90"
              disabled={!gender || !name}
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

export default GenderAndAge; 