
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Calendar, Dumbbell, ClipboardCheck, Award } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  React.useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
      toast({
        title: "Acesso restrito",
        description: "Faça login para acessar o dashboard",
        variant: "destructive"
      });
      navigate('/login');
    }
  }, [navigate, toast]);
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    toast({
      title: "Logout realizado",
      description: "Obrigado por usar o FormFit AI",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="formfit-heading">Dashboard</h1>
            <Button 
              variant="outline"
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Treinos Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-formfit-blue mr-2" />
                  <span className="text-2xl font-bold">12</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Séries Completadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ClipboardCheck className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-2xl font-bold">47</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Minutos Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold">156</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pontos XP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-2xl font-bold">890</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Progresso semanal */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Progresso Semanal</CardTitle>
              <CardDescription>Você está 65% acima da sua meta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Pernas</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Braços</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Abdômen</span>
                    <span className="font-medium">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Botão para treino */}
          <div className="text-center mb-8">
            <Link to="/experiencia-guiada">
              <Button className="bg-formfit-blue hover:bg-formfit-blue/90 text-white font-medium px-8 py-6 rounded-lg text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Iniciar Treino
              </Button>
            </Link>
          </div>
          
          {/* Últimas atividades */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Dumbbell className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Treino de Pernas</p>
                      <p className="text-sm text-gray-500">Agachamento, Avanço</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Ontem</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Dumbbell className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Treino de Braços</p>
                      <p className="text-sm text-gray-500">Rosca Bíceps, Tríceps</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">3 dias atrás</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Dumbbell className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Treino de Abdômen</p>
                      <p className="text-sm text-gray-500">Prancha, Abdominal</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">5 dias atrás</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
