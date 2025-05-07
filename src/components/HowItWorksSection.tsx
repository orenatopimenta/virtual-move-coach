
import React from 'react';

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  isLast?: boolean;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, description, isLast = false }) => {
  return (
    <div className="relative">
      <div className="flex gap-6">
        <div className="relative">
          <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
            {number}
          </div>
          {!isLast && (
            <div className="absolute top-12 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-formfit-purple to-formfit-blue/10"></div>
          )}
        </div>
        <div className="pb-12">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="formfit-section">
      <div className="formfit-container">
        <div className="text-center mb-16">
          <h2 className="formfit-heading">
            Como o <span className="bg-gradient-to-r from-formfit-blue to-formfit-purple bg-clip-text text-transparent">FormFit AI</span> funciona
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Transforme seu smartphone em um personal trainer com apenas alguns passos simples
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <StepCard 
              number="1"
              title="Escolha seu exercício"
              description="Selecione entre nossa biblioteca de exercícios com mais de 100 opções e níveis de dificuldade variados."
            />
            <StepCard 
              number="2"
              title="Posicione seu smartphone"
              description="Coloque seu telefone no chão em modo selfie ou use um suporte para que a câmera possa ver seu corpo inteiro."
            />
            <StepCard 
              number="3"
              title="Receba feedback em tempo real"
              description="Nossa IA analisa sua postura e movimentos, fornecendo correções em tempo real para garantir a forma perfeita."
            />
            <StepCard 
              number="4"
              title="Acompanhe seu progresso"
              description="Veja estatísticas detalhadas do seu treino, incluindo repetições, tempo e melhoria na qualidade do movimento ao longo do tempo."
              isLast
            />
          </div>
          <div className="relative">
            <div className="bg-white p-3 rounded-2xl shadow-xl">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl overflow-hidden aspect-[9/16] relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
                  <div className="w-full max-w-xs">
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4 relative">
                      <div className="absolute -top-2 -left-2 h-8 w-8 bg-formfit-blue rounded-lg flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      <h4 className="font-medium mb-1 mt-2 ml-4">Posição Inicial</h4>
                      <div className="h-24 bg-gray-100 rounded-md flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-gray-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4 relative">
                      <div className="absolute -top-2 -left-2 h-8 w-8 bg-formfit-purple rounded-lg flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <h4 className="font-medium mb-1 mt-2 ml-4">Movimento</h4>
                      <div className="h-24 bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="relative">
                          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-gray-400 transform -rotate-15"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <div className="absolute inset-0 border-2 border-formfit-pink rounded-full animate-pulse-light opacity-60"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mb-4">
                      <div className="bg-white px-3 py-2 rounded-lg shadow-md text-center flex-1 mr-2">
                        <p className="text-xs text-gray-500">Repetições</p>
                        <p className="font-bold text-lg">8/12</p>
                      </div>
                      <div className="bg-white px-3 py-2 rounded-lg shadow-md text-center flex-1 ml-2">
                        <p className="text-xs text-gray-500">Precisão</p>
                        <p className="font-bold text-lg">93%</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg shadow-md">
                      <div className="bg-blue-50 rounded-md p-2 flex items-center">
                        <div className="h-8 w-8 bg-formfit-blue rounded-full flex items-center justify-center text-white mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <p className="text-sm">Levante os braços um pouco mais!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
