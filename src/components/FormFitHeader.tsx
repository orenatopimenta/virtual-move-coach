import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

const FormFitHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">F</div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-formfit-blue to-formfit-purple bg-clip-text text-transparent">
            AI Trainer
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-600 hover:text-formfit-blue transition-colors">Recursos</a>
          <a href="#how-it-works" className="text-gray-600 hover:text-formfit-blue transition-colors">Como Funciona</a>
          <a href="#testimonials" className="text-gray-600 hover:text-formfit-blue transition-colors">Depoimentos</a>
          <a href="#pricing" className="text-gray-600 hover:text-formfit-blue transition-colors">Preços</a>
        </nav>
        
        <div className="flex items-center gap-2">
          <Link to="/primeiro-acesso">
            <Button className="formfit-btn-primary">Cadastre-se</Button>
          </Link>
          <Link to="/login">
            <Button className="formfit-btn-outline">Login</Button>
          </Link>
          <Link to="/perfil">
            <Button variant="ghost" size="icon" aria-label="Perfil">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default FormFitHeader;
