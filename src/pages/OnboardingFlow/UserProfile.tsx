import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Minus, Plus, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const UserProfile: React.FC = () => {
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState(25);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender);
    toast({
      title: "Gênero selecionado",
      description: `Você selecionou ${selectedGender}.`,
      duration: 1500,
    });
  };

  const increaseAge = () => {
    if (age < 99) setAge(prev => prev + 1);
  };

  const decreaseAge = () => {
    if (age > 16) setAge(prev => prev - 1);
  };

  const handleRegister = async () => {
    if (!name || !gender) {
      toast({
        title: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    // Pega usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      setIsLoading(false);
      toast({ title: 'Usuário não autenticado', variant: 'destructive' });
      return;
    }
    // Salva perfil
    const { error: profileError } = await supabase.from('user_profiles').upsert({
      id: user.id,
      full_name: name,
      gender,
      age
    });
    setIsLoading(false);
    if (profileError) {
      toast({ title: 'Erro ao salvar perfil', description: profileError.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Cadastro realizado!', description: 'Bem-vindo ao AI Trainer!' });
    navigate('/dashboard');
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
            <h1 className="formfit-heading text-center flex-1">Perfil</h1>
          </div>
          
          <div className="space-y-8 max-w-md mx-auto">
            <div>
              <h2 className="formfit-subheading mb-4">Gênero</h2>
              <div className="flex justify-between gap-3">
                <button
                  onClick={() => handleGenderSelect("Homem")}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    gender === "Homem" ? "bg-formfit-blue text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  <Radio className="h-5 w-5" />
                  <span className="font-medium">Homem</span>
                </button>
                <button
                  onClick={() => handleGenderSelect("Mulher")}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    gender === "Mulher" ? "bg-formfit-blue text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  <Radio className="h-5 w-5" />
                  <span className="font-medium">Mulher</span>
                </button>
                <button
                  onClick={() => handleGenderSelect("Outro")}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    gender === "Outro" ? "bg-formfit-blue text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  <Radio className="h-5 w-5" />
                  <span className="font-medium">Outro</span>
                </button>
              </div>
            </div>
            
            <div>
              <h2 className="formfit-subheading mb-4">Idade</h2>
              <div className="flex items-center justify-between max-w-xs mx-auto">
                <button
                  onClick={decreaseAge}
                  className="bg-gray-200 hover:bg-gray-300 rounded-full w-12 h-12 flex items-center justify-center"
                >
                  <Minus className="h-6 w-6" />
                </button>
                <span className="text-4xl font-bold text-gray-800">{age}</span>
                <button
                  onClick={increaseAge}
                  className="bg-gray-200 hover:bg-gray-300 rounded-full w-12 h-12 flex items-center justify-center"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Nome</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="text"
                placeholder="Digite seu nome"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="mt-12 flex justify-center">
            <Button 
              onClick={handleRegister}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-6 rounded-lg text-lg"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
