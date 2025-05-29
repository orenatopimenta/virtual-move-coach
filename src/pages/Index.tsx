import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import PricingSection from '@/components/PricingSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { Button } from '@/components/ui/button';
import TreinoPersonalizado from './ExperienciaGuiada/TreinoPersonalizado';
import { VideoCarousel } from '@/components/VideoCarousel';

const Videos2Carousel: React.FC = () => {
  const videos = [
    { src: '/videos/videos2/demo2.mp4', alt: 'Demonstração 2' },
    // Adicione mais vídeos aqui conforme necessário
  ];
  const [current, setCurrent] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [dragging, setDragging] = useState(false);
  const touch = React.useRef<{startX: number, lastX: number, dragging: boolean}>({startX: 0, lastX: 0, dragging: false});
  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % videos.length);
        setOpacity(1);
      }, 800);
    }, 5000);
    return () => clearInterval(interval);
  }, [videos.length]);
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touch.current.startX = x;
    touch.current.lastX = x;
    touch.current.dragging = true;
    setDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touch.current.dragging) return;
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touch.current.lastX = x;
  };
  const handleTouchEnd = () => {
    if (!touch.current.dragging) return;
    const delta = touch.current.lastX - touch.current.startX;
    if (Math.abs(delta) > 40) {
      setOpacity(0);
      setTimeout(() => {
        if (delta < 0) {
          setCurrent((prev) => (prev + 1) % videos.length);
        } else {
          setCurrent((prev) => (prev - 1 + videos.length) % videos.length);
        }
        setOpacity(1);
      }, 200);
    }
    touch.current.dragging = false;
    setDragging(false);
  };
  return (
    <section className="formfit-container flex justify-center py-4">
      <div
        className="w-[360px] h-[240px] bg-white rounded-2xl shadow-xl flex items-center justify-center text-center mx-auto transition-opacity duration-700 select-none relative"
        style={{ opacity }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={dragging ? handleTouchMove : undefined}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <video
          src={videos[current].src}
          className="w-full h-full object-contain rounded-xl"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute bottom-3 right-4 flex gap-2">
          {videos.map((_, idx) => (
            <span
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === current ? 'bg-formfit-blue scale-125' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const FrasesCarousel: React.FC = () => {
  const frases = [
    'Desenvolvido com base em movimentos de atletas IFBB, Wellness e Classic Physique',
    'Tecnologia inspirada nos treinos dos melhores treinadores funcionais',
    'Modelos de IA treinados para iniciantes e avançados',
    'Análises de milhares de vídeos das redes sociais de atletas Aesthetics'
  ];
  const [current, setCurrent] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [dragging, setDragging] = useState(false);
  const touch = React.useRef<{startX: number, lastX: number, dragging: boolean}>({startX: 0, lastX: 0, dragging: false});
  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % frases.length);
        setOpacity(1);
      }, 800);
    }, 5000);
    return () => clearInterval(interval);
  }, [frases.length]);
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touch.current.startX = x;
    touch.current.lastX = x;
    touch.current.dragging = true;
    setDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touch.current.dragging) return;
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touch.current.lastX = x;
  };
  const handleTouchEnd = () => {
    if (!touch.current.dragging) return;
    const delta = touch.current.lastX - touch.current.startX;
    if (Math.abs(delta) > 40) {
      setOpacity(0);
      setTimeout(() => {
        if (delta < 0) {
          setCurrent((prev) => (prev + 1) % frases.length);
        } else {
          setCurrent((prev) => (prev - 1 + frases.length) % frases.length);
        }
        setOpacity(1);
      }, 200);
    }
    touch.current.dragging = false;
    setDragging(false);
  };
  return (
    <section className="formfit-container flex justify-center py-2">
      <div
        className="w-[360px] h-[80px] bg-white rounded-2xl shadow-xl flex items-center justify-center text-center mx-auto transition-opacity duration-700 select-none relative"
        style={{ opacity }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={dragging ? handleTouchMove : undefined}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <span className="text-xl md:text-2xl font-semibold text-gray-700 px-6">
          {frases[current]}
        </span>
      </div>
    </section>
  );
};

const Index: React.FC = () => {
  const videos2 = [
    { src: '/videos/videos2/demo2.mp4', alt: 'Demonstração 2' },
    // Remova outros vídeos duplicados, deixe apenas o desejado
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <FormFitHeader />
      <main>
        <HeroSection />
        <div className="formfit-container py-8 px-4">
          <div className="flex flex-col justify-center gap-4 max-w-md mx-auto">
            <h1 className="formfit-heading text-center flex-1">Bem-vindo</h1>
            <Link to="/treino-guiado">
              <Button className="w-full bg-formfit-blue hover:bg-formfit-blue/90 text-white font-medium py-3 rounded-lg text-lg">
                Experiência Guiada
              </Button>
            </Link>
            <Link to="/primeiro-acesso">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg text-lg">
                Primeiro Acesso
              </Button>
            </Link>
            <Link to="/login">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg text-lg">
                Login
              </Button>
            </Link>
          </div>
        </div>
        <VideoCarousel videos={videos2} className="py-4" />
        <FrasesCarousel />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Index;
