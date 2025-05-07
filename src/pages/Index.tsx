
import React from 'react';
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

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <FormFitHeader />
      <main>
        <HeroSection />
        <div className="formfit-container py-8">
          <div className="flex justify-center">
            <Link to="/workout">
              <Button className="bg-formfit-blue hover:bg-formfit-blue/90 text-white font-medium px-8 py-3 rounded-lg text-lg">
                Experimente o FormFit AI Agora
              </Button>
            </Link>
          </div>
        </div>
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
