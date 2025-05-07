
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const CTASection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulando submissão do formulário
    setTimeout(() => {
      toast({
        title: "Inscrição realizada com sucesso!",
        description: "Você receberá atualizações sobre o lançamento do FormFit AI.",
      });
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section id="early-access" className="formfit-section bg-gradient-to-br from-formfit-blue to-formfit-darkblue text-white">
      <div className="formfit-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar seus treinos?
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Junte-se à nossa lista de espera e seja um dos primeiros a experimentar o FormFit AI
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/20 border-white/20 text-white placeholder:text-white/70 focus:ring-white/50"
            />
            <Button 
              type="submit" 
              className="bg-white text-formfit-blue hover:bg-white/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Entrar para lista de espera"}
            </Button>
          </form>
          
          <p className="mt-6 text-sm opacity-80">
            Seja notificado quando lançarmos. Sem spam, prometemos.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
