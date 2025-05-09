
import React from 'react';
import { Link } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AreasDeExercicio: React.FC = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/');
  };
  
  const muscleGroups = [
    {
      id: 'pernas',
      name: 'Pernas',
      color: 'bg-gradient-to-r from-blue-400 to-blue-600',
      available: true
    },
    {
      id: 'braco',
      name: 'Braços',
      color: 'bg-gradient-to-r from-red-400 to-red-600',
      available: false
    },
    {
      id: 'peito',
      name: 'Peito',
      color: 'bg-gradient-to-r from-green-400 to-green-600',
      available: false
    },
    {
      id: 'costas',
      name: 'Costas',
      color: 'bg-gradient-to-r from-purple-400 to-purple-600',
      available: false
    },
    {
      id: 'abdomen',
      name: 'Abdômen',
      color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      available: false
    }
  ];

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            {muscleGroups.map((group) => (
              <div 
                key={group.id}
                className={`relative h-24 rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105 ${group.color}`}
              >
                {group.available ? (
                  <Link 
                    to={`/experiencia-guiada/exercicios/${group.id}`}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-white font-bold text-xl">{group.name}</span>
                  </Link>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-between px-6">
                    <span className="text-white font-bold text-xl">{group.name}</span>
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AreasDeExercicio;
