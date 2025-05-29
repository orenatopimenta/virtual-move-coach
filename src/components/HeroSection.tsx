import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { VideoCarousel } from '@/components/VideoCarousel';

const HeroSection: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [currentText, setCurrentText] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const media = [
    { type: "image", src: "/images/workout.png", alt: "Exercício com halteres" },
    { type: "video", src: "/videos/demo1.mp4", alt: "Demonstração de exercício", poster: "/images/poster1.png" },
    { type: "image", src: "/images/workout2.png", alt: "Exercício com halteres 2" },
    { type: "video", src: "/videos/demo2.mp4", alt: "Demonstração de exercício 2", poster: "/images/poster2.png" }
  ];

  const texts = [
    'Seu Personal Trainer de IA na Palma da sua Mão',
    'Treine com Inteligência Artificial, onde e quando quiser',
    'O primeiro aplicativo Brasileiro com análise biomecânica baseada em IA',
    'Modelos de IA treinados com treinos de atletas IFBB Pro',
    'Iniciantes: Treino com apoio profissional, mesmo sem academia',
    'Nossos modelos de IA foram treinados com milhares de horas de vídeo de atletas profissionais',
    'Correções em tempo real com base em biomecânica avançada',
    'Tenha acesso a treinos personalizados com base em análise de dados reais de atletas e personais trainers'
  ];

  const videos1 = [
    { src: '/videos/videos1/demo1.mp4', alt: 'Demonstração 1' },
    // Adicione mais vídeos aqui conforme necessário
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCurrentImage((prev) => (prev + 1) % media.length);
        setCurrentText((prev) => (prev + 1) % texts.length);
        setOpacity(1);
      }, 1500);
    }, 5000);
    return () => clearInterval(interval);
  }, [media.length, texts.length]);

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white formfit-section pt-2 md:pt-4">
      <div className="formfit-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-1 md:order-1">
            <VideoCarousel videos={videos1} />
          </div>
          <div className="order-2 md:order-2">
            <div className="inline-block bg-blue-100 text-formfit-blue px-4 py-1 rounded-full mb-4 font-medium text-sm">
              Versão Beta · Acesso Antecipado
            </div>
            <h1 className="formfit-heading">
              <span className="bg-gradient-to-r from-formfit-blue to-formfit-purple bg-clip-text text-transparent">
                {texts[currentText]}
              </span>
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              AI Trainer analisa sua postura em tempo real, corrige seus movimentos e transforma seu smartphone em um personal trainer particular, acessível 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#early-access" className="formfit-btn-primary flex items-center justify-center gap-2">
                Experimente já <ArrowRight size={16} />
              </a>
              <a href="#how-it-works" className="formfit-btn-outline flex items-center justify-center">
                Como Funciona
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
