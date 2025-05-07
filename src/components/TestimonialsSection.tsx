
import React from 'react';

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  image: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, author, role, image }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-formfit-blue opacity-20"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
      </div>
      <p className="text-gray-700 mb-6 italic">"{quote}"</p>
      <div className="flex items-center">
        <div className="h-12 w-12 bg-gray-200 rounded-full mr-4">
          {/* This would be replaced with an actual image in a real app */}
          <div className="h-full w-full rounded-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold text-lg">
            {author.charAt(0)}
          </div>
        </div>
        <div>
          <h4 className="font-medium">{author}</h4>
          <p className="text-gray-600 text-sm">{role}</p>
        </div>
      </div>
    </div>
  );
};

const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="formfit-section bg-gray-50">
      <div className="formfit-container">
        <div className="text-center mb-16">
          <h2 className="formfit-heading">
            O que nossos usuários estão dizendo
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Milhares de pessoas já transformaram seus treinos com o FormFit AI
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Testimonial
            quote="Finalmente consegui corrigir minha forma nos agachamentos. O feedback em tempo real é incrível e me ajudou a evitar dores nas costas."
            author="Carlos Silva"
            role="Usuário há 3 meses"
            image=""
          />
          <Testimonial
            quote="Como personal trainer, recomendo o FormFit AI para meus clientes treinarem nos dias em que não estamos juntos. É como ter um segundo par de olhos observando a técnica deles."
            author="Fernanda Oliveira"
            role="Personal Trainer"
            image=""
          />
          <Testimonial
            quote="Treinando em casa durante a pandemia, o FormFit AI foi essencial para manter minha motivação e garantir que eu não estivesse fazendo os exercícios de forma errada."
            author="Ricardo Mendes"
            role="Usuário há 6 meses"
            image=""
          />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
