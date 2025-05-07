
import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white mb-4">
        {icon}
      </div>
      <h3 className="formfit-subheading">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="formfit-section bg-gray-50">
      <div className="formfit-container">
        <div className="text-center mb-16">
          <h2 className="formfit-heading">
            Por que escolher o <span className="bg-gradient-to-r from-formfit-blue to-formfit-purple bg-clip-text text-transparent">FormFit AI</span>?
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Nosso aplicativo usa tecnologia avançada de IA para trazer o melhor da experiência de treino personalizado para seu smartphone.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
            title="Análise de Postura em Tempo Real"
            description="Nossa IA analisa sua postura durante os exercícios e fornece feedback instantâneo para evitar lesões e maximizar resultados."
          />
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
            title="Acompanhamento de Progresso"
            description="Acompanhe suas melhorias ao longo do tempo com estatísticas detalhadas e visualizações do seu desenvolvimento físico."
          />
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-check"><path d="m3 5 2 2 4-4"/><path d="m3 12 2 2 4-4"/><path d="m3 19 2 2 4-4"/><line x1="13" x2="22" y1="6" y2="6"/><line x1="13" x2="22" y1="13" y2="13"/><line x1="13" x2="22" y1="20" y2="20"/></svg>}
            title="Planos de Treino Personalizados"
            description="Receba planos de treino adaptados ao seu nível de condicionamento, objetivos e equipamentos disponíveis."
          />
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>}
            title="Contador de Repetições"
            description="Deixe o FormFit AI contar suas repetições automaticamente enquanto você se concentra na qualidade dos movimentos."
          />
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-timer"><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/><line x1="12" x2="12" y1="14" y2="16"/><line x1="12" x2="12.01" y1="20" y2="20"/><path d="M5.37 5.37 4.3 4.3"/><path d="m18.63 5.37 1.07-1.07"/><path d="M10.42 10.42a3 3 0 1 0 4.24 4.24 3 3 0 0 0-4.24-4.24Z"/><path d="M7 12a5 5 0 0 1 5-5"/><path d="M17 12a5 5 0 0 0-5-5"/><path d="M12 17a5 5 0 0 0 5-5"/></svg>}
            title="Treinos Cronometrados"
            description="Utilize nossos temporizadores inteligentes para intervalos de descanso e treinos de alta intensidade otimizados."
          />
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>}
            title="Comunidade de Apoio"
            description="Conecte-se com outros usuários, compartilhe conquistas e participe de desafios para manter a motivação."
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
