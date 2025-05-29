import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TreinoIA from './pages/TreinoIA';
import Perfil from './pages/Perfil';
import ParametrosTreino from './pages/ParametrosTreino';
// Importe outras páginas conforme necessário

const AppRoutes = () => (
  <Routes>
    <Route path="/treino-ia" element={<TreinoIA />} />
    <Route path="/perfil" element={<Perfil />} />
    <Route path="/parametros-treino" element={<ParametrosTreino />} />
    {/* Outras rotas existentes aqui */}
  </Routes>
);

export default AppRoutes; 