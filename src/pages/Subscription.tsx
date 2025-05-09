
import React from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Subscription: React.FC = () => {
  const navigate = useNavigate();

  const handleSubscribe = (plan: string) => {
    // In a real app, this would redirect to a payment gateway
    localStorage.setItem('subscribed', 'true');
    localStorage.setItem('subscriptionPlan', plan);
    
    // Redirect to registration
    navigate('/onboarding/registration');
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
            <h1 className="formfit-heading text-center flex-1">Escolha seu plano</h1>
          </div>
          
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-gray-600">Escolha o plano que melhor atende suas necessidades e comece sua jornada fitness hoje!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-lg">Básico</CardTitle>
                <div className="text-3xl font-bold">R$29,90<span className="text-base font-normal text-gray-500">/mês</span></div>
                <CardDescription>Para iniciantes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Treinos para pernas</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Análise de postura</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Dashboard de progresso</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSubscribe('basic')}
                  className="w-full"
                >
                  Assinar plano Básico
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-formfit-blue relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-formfit-blue text-white px-4 py-1 rounded-full text-sm font-medium">
                Mais Popular
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Pro</CardTitle>
                <div className="text-3xl font-bold">R$49,90<span className="text-base font-normal text-gray-500">/mês</span></div>
                <CardDescription>Para entusiastas do fitness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Todos os treinos disponíveis</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Análise de postura avançada</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Histórico detalhado de treinos</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Planos personalizados</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSubscribe('pro')}
                  className="w-full bg-formfit-blue hover:bg-formfit-blue/90"
                >
                  Assinar plano Pro
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Premium</CardTitle>
                <div className="text-3xl font-bold">R$79,90<span className="text-base font-normal text-gray-500">/mês</span></div>
                <CardDescription>Para atletas comprometidos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Todos os recursos do plano Pro</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Coach pessoal via chat</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Planos nutricionais</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Avaliações mensais</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSubscribe('premium')}
                  className="w-full"
                >
                  Assinar plano Premium
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Subscription;
