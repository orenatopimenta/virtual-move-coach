import React from 'react';
import { Check } from 'lucide-react';

interface PlanFeature {
  feature: string;
  included: boolean;
}

interface PricingPlanProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
  buttonText: string;
}

const PricingPlan: React.FC<PricingPlanProps> = ({ 
  name, 
  price, 
  period,
  description, 
  features, 
  isPopular = false,
  buttonText
}) => {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden border transition-all ${isPopular ? 'shadow-lg border-formfit-blue transform scale-105 z-10' : 'shadow-sm hover:shadow-md'}`}>
      {isPopular && (
        <div className="bg-formfit-blue text-white text-center py-2 text-sm font-semibold">
          MAIS POPULAR
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="flex items-end mb-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-gray-500 ml-2">{period}</span>
        </div>
        <p className="text-gray-600 mb-6">{description}</p>
        
        <a href="#early-access" className={`block text-center py-3 px-4 rounded-lg mb-6 transition-colors ${isPopular ? 'bg-gradient-primary text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
          {buttonText}
        </a>
        
        <div className="space-y-3">
          {features.map((item, index) => (
            <div key={index} className="flex items-center">
              {item.included ? (
                <div className="h-5 w-5 rounded-full bg-formfit-blue/10 flex items-center justify-center mr-3">
                  <Check className="h-3 w-3 text-formfit-blue" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full"></div>
                </div>
              )}
              <span className={item.included ? 'text-gray-800' : 'text-gray-500'}>{item.feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PricingSection: React.FC = () => {
  const freeFeatures = [
    { feature: "Análise básica de postura", included: true },
    { feature: "Biblioteca com 20 exercícios", included: true },
    { feature: "Contador de repetições", included: true },
    { feature: "1 plano de treino", included: true },
    { feature: "Feedback de postura limitado", included: true },
    { feature: "Planos de treino personalizados", included: false },
    { feature: "Suporte prioritário", included: false },
    { feature: "Análise avançada de postura", included: false }
  ];
  
  const proFeatures = [
    { feature: "Análise básica de postura", included: true },
    { feature: "Biblioteca com +100 exercícios", included: true },
    { feature: "Contador de repetições", included: true },
    { feature: "Planos de treino ilimitados", included: true },
    { feature: "Feedback de postura avançado", included: true },
    { feature: "Planos de treino personalizados", included: true },
    { feature: "Suporte prioritário", included: true },
    { feature: "Análise avançada de postura", included: true }
  ];

  return (
    <section id="pricing" className="formfit-section">
      <div className="formfit-container">
        <div className="text-center mb-16">
          <h2 className="formfit-heading">
            Planos simples e transparentes
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Escolha o plano que melhor se adapta às suas necessidades
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <PricingPlan 
            name="Plano inicial"
            price="R$ 29,90"
            period="/mês"
            description="Perfeito para experimentar e conhecer a plataforma."
            features={freeFeatures}
            buttonText="Começar Agora"
          />
          
          <PricingPlan 
            name="Pro"
            price="R$ 79,90"
            period="/mês"
            description="Acesso completo a todos os recursos e novidades."
            features={proFeatures}
            isPopular={true}
            buttonText="Obter Acesso Antecipado"
          />
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            Tem dúvidas sobre qual plano escolher?{" "}
            <a href="#" className="text-formfit-blue hover:underline">Entre em contato</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
