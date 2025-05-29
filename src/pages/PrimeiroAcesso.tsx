import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft } from 'lucide-react';

const PrimeiroAcesso: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro!",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Cadastro real com Supabase
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    setIsLoading(false);
    if (error) {
      toast({
        title: "Erro ao cadastrar!",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Cadastro realizado!",
      description: "Agora você pode fazer login.",
    });
    navigate('/login');
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
          <h1 className="formfit-heading text-center flex-1">Primeiro Acesso</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-formfit-blue hover:underline">
                Fazer login
              </Link>
            </p>
            
            <Link to="/" className="block mt-4 text-sm text-gray-500 hover:underline">
              Voltar para página inicial
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrimeiroAcesso;
