
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white formfit-section pt-20 md:pt-28">
      <div className="formfit-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-blue-100 text-formfit-blue px-4 py-1 rounded-full mb-4 font-medium text-sm">
              Versão Beta · Acesso Antecipado
            </div>
            <h1 className="formfit-heading">
              Seu <span className="bg-gradient-to-r from-formfit-blue to-formfit-purple bg-clip-text text-transparent">Personal Trainer</span> de IA na Palma da sua Mão
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              FormFit AI analisa sua postura em tempo real, corrige seus movimentos e transforma seu smartphone em um personal trainer particular, acessível 24/7.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#early-access" className="formfit-btn-primary flex items-center justify-center gap-2">
                Experimente Grátis <ArrowRight size={16} />
              </a>
              <a href="#how-it-works" className="formfit-btn-outline flex items-center justify-center">
                Como Funciona
              </a>
            </div>
            
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-white"></div>
              </div>
              <p className="text-sm text-gray-600">
                Junte-se a <span className="font-bold">2,500+</span> usuários satisfeitos
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative z-10 bg-white p-2 rounded-2xl shadow-xl animate-float">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl overflow-hidden aspect-[9/16] relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="h-36 w-36 bg-formfit-blue/20 rounded-full flex items-center justify-center">
                    <div className="h-24 w-24 bg-formfit-blue/30 rounded-full flex items-center justify-center">
                      <div className="h-16 w-16 bg-gradient-primary rounded-full flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center">
                    <h3 className="font-bold text-xl mb-2">FormFit AI</h3>
                    <p className="text-gray-500">Seu treinador pessoal inteligente</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute top-1/2 -right-8 -translate-y-1/2 bg-white p-3 rounded-xl shadow-lg">
              <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-lg">
                <div className="bg-formfit-blue h-10 w-10 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Postura</p>
                  <p className="font-semibold">Perfeita</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-white p-3 rounded-xl shadow-lg">
              <div className="flex items-center gap-3 bg-purple-50 p-2 rounded-lg">
                <div className="bg-formfit-purple h-10 w-10 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dumbbell"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Repetições</p>
                  <p className="font-semibold">12 de 15</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
