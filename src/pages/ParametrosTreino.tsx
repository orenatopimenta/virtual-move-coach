import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const MODELOS = ['Iniciante', 'Resistência', 'Aesthetics', 'Glúteos +', 'IFBB Pro', 'Pilates Slim'];
const EXERCICIOS = [
  'Agachamento', 'Rosca Bíceps', 'Supino', 'Flexão de Braço', 'Tríceps', 'Leg Press', 'Avanço', 'Remada', 'Abdominal', 'Desenvolvimento',
];

const PARAMETROS_PADRAO: Record<string, Record<string, { carga: string, anguloMax?: number, anguloMin?: number, amplitude?: number, velocidadeSubida?: number, velocidadeDescida?: number, tempoExecucao?: number }>> = {
  'Iniciante': {
    'Agachamento': { carga: 'Corpo livre', anguloMax: 120, anguloMin: 60, amplitude: 60, velocidadeSubida: 1.0, velocidadeDescida: 1.2, tempoExecucao: 2.2 },
    'Rosca Bíceps': { carga: 'Leve', anguloMax: 110, anguloMin: 40, amplitude: 70, velocidadeSubida: 0.8, velocidadeDescida: 1.0, tempoExecucao: 1.8 },
    'Supino': { carga: 'Leve', anguloMax: 100, anguloMin: 30, amplitude: 70, velocidadeSubida: 1.1, velocidadeDescida: 1.2, tempoExecucao: 2.3 },
  },
  'IFBB Pro': {
    'Agachamento': { carga: 'Alta', anguloMax: 130, anguloMin: 50, amplitude: 80, velocidadeSubida: 0.9, velocidadeDescida: 1.1, tempoExecucao: 2.0 },
    'Rosca Bíceps': { carga: 'Alta', anguloMax: 120, anguloMin: 30, amplitude: 90, velocidadeSubida: 0.7, velocidadeDescida: 0.9, tempoExecucao: 1.6 },
    'Supino': { carga: 'Alta', anguloMax: 110, anguloMin: 20, amplitude: 90, velocidadeSubida: 1.0, velocidadeDescida: 1.1, tempoExecucao: 2.1 },
  },
};

const getParametrosFromStorage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('parametrosTreino');
    if (saved) return JSON.parse(saved);
  }
  return PARAMETROS_PADRAO;
};

const fetchParametrosFromSupabase = async () => {
  const { data, error } = await supabase.from('treino_parametros').select('*');
  if (error) return null;
  // Converte para o formato esperado pelo estado local
  const result: any = {};
  data.forEach((row: any) => {
    if (!result[row.modelo]) result[row.modelo] = {};
    result[row.modelo][row.exercicio] = {
      carga: row.carga || '',
      anguloMax: row.angulo_max ?? undefined,
      anguloMin: row.angulo_min ?? undefined,
      amplitude: row.amplitude ?? undefined,
      velocidadeSubida: row.velocidade_subida ?? undefined,
      velocidadeDescida: row.velocidade_descida ?? undefined,
      tempoExecucao: row.tempo_execucao ?? undefined,
    };
  });
  return result;
};

const upsertParametroToSupabase = async (modelo: string, ex: string, param: any) => {
  const { error } = await supabase.from('treino_parametros').upsert({
    modelo,
    exercicio: ex,
    carga: param.carga,
    angulo_max: param.anguloMax,
    angulo_min: param.anguloMin,
    amplitude: param.amplitude,
    velocidade_subida: param.velocidadeSubida,
    velocidade_descida: param.velocidadeDescida,
    tempo_execucao: param.tempoExecucao,
    updated_at: new Date().toISOString(),
  });
  return !error;
};

const ParametrosTreino: React.FC = () => {
  const [parametros, setParametros] = useState(getParametrosFromStorage());
  const [editando, setEditando] = useState<{ modelo: string, ex: string } | null>(null);
  const [linhaEdit, setLinhaEdit] = useState<any>({});
  const [adicionando, setAdicionando] = useState(false);
  const [novaLinha, setNovaLinha] = useState({ modelo: MODELOS[0], ex: EXERCICIOS[0], carga: '', anguloMax: '', anguloMin: '', amplitude: '', velocidadeSubida: '', velocidadeDescida: '', tempoExecucao: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parametrosTreino', JSON.stringify(parametros));
    }
  }, [parametros]);

  useEffect(() => {
    fetchParametrosFromSupabase().then((parametrosSupabase) => {
      if (parametrosSupabase && Object.keys(parametrosSupabase).length > 0) {
        setParametros(parametrosSupabase);
        if (typeof window !== 'undefined') {
          localStorage.setItem('parametrosTreino', JSON.stringify(parametrosSupabase));
        }
      }
    });
  }, []);

  const handleEdit = (modelo: string, ex: string) => {
    setEditando({ modelo, ex });
    setLinhaEdit({ ...parametros[modelo][ex] });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLinhaEdit({ ...linhaEdit, [e.target.name]: e.target.value });
  };

  const handleSave = async (modelo: string, ex: string) => {
    const novoParametro = {
      ...linhaEdit,
      anguloMax: linhaEdit.anguloMax ? Number(linhaEdit.anguloMax) : undefined,
      anguloMin: linhaEdit.anguloMin ? Number(linhaEdit.anguloMin) : undefined,
      amplitude: linhaEdit.amplitude ? Number(linhaEdit.amplitude) : undefined,
      velocidadeSubida: linhaEdit.velocidadeSubida ? Number(linhaEdit.velocidadeSubida) : undefined,
      velocidadeDescida: linhaEdit.velocidadeDescida ? Number(linhaEdit.velocidadeDescida) : undefined,
      tempoExecucao: linhaEdit.tempoExecucao ? Number(linhaEdit.tempoExecucao) : undefined,
    };
    setParametros((prev: any) => ({
      ...prev,
      [modelo]: {
        ...prev[modelo],
        [ex]: novoParametro,
      },
    }));
    await upsertParametroToSupabase(modelo, ex, novoParametro);
    setEditando(null);
    setLinhaEdit({});
  };

  const handleAddLinha = () => {
    setAdicionando(true);
    setNovaLinha({ modelo: MODELOS[0], ex: EXERCICIOS[0], carga: '', anguloMax: '', anguloMin: '', amplitude: '', velocidadeSubida: '', velocidadeDescida: '', tempoExecucao: '' });
  };

  const handleNovaLinhaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNovaLinha({ ...novaLinha, [e.target.name]: e.target.value });
  };

  const handleSalvarNovaLinha = async () => {
    const novoParametro = {
      carga: novaLinha.carga,
      anguloMax: novaLinha.anguloMax ? Number(novaLinha.anguloMax) : undefined,
      anguloMin: novaLinha.anguloMin ? Number(novaLinha.anguloMin) : undefined,
      amplitude: novaLinha.amplitude ? Number(novaLinha.amplitude) : undefined,
      velocidadeSubida: novaLinha.velocidadeSubida ? Number(novaLinha.velocidadeSubida) : undefined,
      velocidadeDescida: novaLinha.velocidadeDescida ? Number(novaLinha.velocidadeDescida) : undefined,
      tempoExecucao: novaLinha.tempoExecucao ? Number(novaLinha.tempoExecucao) : undefined,
    };
    setParametros((prev: any) => {
      const novo = { ...prev };
      if (!novo[novaLinha.modelo]) novo[novaLinha.modelo] = {};
      novo[novaLinha.modelo][novaLinha.ex] = novoParametro;
      return novo;
    });
    await upsertParametroToSupabase(novaLinha.modelo, novaLinha.ex, novoParametro);
    setAdicionando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow flex flex-col items-center py-8">
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-md p-6 overflow-x-auto">
          <div className="mb-4 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="formfit-heading text-center flex-1">Parâmetros de Treino</h1>
          </div>
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Modelo</th>
                <th className="border px-4 py-2">Exercício</th>
                <th className="border px-4 py-2">Carga</th>
                <th className="border px-4 py-2">Ângulo Máx</th>
                <th className="border px-4 py-2">Ângulo Mín</th>
                <th className="border px-4 py-2">Amplitude</th>
                <th className="border px-4 py-2">Vel. Subida</th>
                <th className="border px-4 py-2">Vel. Descida</th>
                <th className="border px-4 py-2">Tempo Execução</th>
                <th className="border px-4 py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(parametros).map(modelo => (
                Object.keys(parametros[modelo] || {}).map((ex, i) => (
                  <tr key={modelo + ex} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-4 py-2 font-semibold">{modelo}</td>
                    <td className="border px-4 py-2">{ex}</td>
                    {editando && editando.modelo === modelo && editando.ex === ex ? (
                      <>
                        <td className="border px-2 py-2"><input name="carga" className="w-24 border rounded px-1" value={linhaEdit.carga} onChange={handleChange} /></td>
                        <td className="border px-2 py-2"><input name="anguloMax" type="number" className="w-16 border rounded px-1" value={linhaEdit.anguloMax || ''} onChange={handleChange} /></td>
                        <td className="border px-2 py-2"><input name="anguloMin" type="number" className="w-16 border rounded px-1" value={linhaEdit.anguloMin || ''} onChange={handleChange} /></td>
                        <td className="border px-2 py-2"><input name="amplitude" type="number" className="w-16 border rounded px-1" value={linhaEdit.amplitude || ''} onChange={handleChange} /></td>
                        <td className="border px-2 py-2"><input name="velocidadeSubida" type="number" step="0.01" className="w-16 border rounded px-1" value={linhaEdit.velocidadeSubida || ''} onChange={handleChange} /></td>
                        <td className="border px-2 py-2"><input name="velocidadeDescida" type="number" step="0.01" className="w-16 border rounded px-1" value={linhaEdit.velocidadeDescida || ''} onChange={handleChange} /></td>
                        <td className="border px-2 py-2"><input name="tempoExecucao" type="number" step="0.01" className="w-16 border rounded px-1" value={linhaEdit.tempoExecucao || ''} onChange={handleChange} /></td>
                        <td className="border px-2 py-2"><Button size="sm" onClick={() => handleSave(modelo, ex)}>Salvar</Button></td>
                      </>
                    ) : (
                      <>
                        <td className="border px-4 py-2">{parametros[modelo][ex].carga}</td>
                        <td className="border px-4 py-2">{parametros[modelo][ex].anguloMax ?? '-'}</td>
                        <td className="border px-4 py-2">{parametros[modelo][ex].anguloMin ?? '-'}</td>
                        <td className="border px-4 py-2">{parametros[modelo][ex].amplitude ?? '-'}</td>
                        <td className="border px-4 py-2">{parametros[modelo][ex].velocidadeSubida ?? '-'}</td>
                        <td className="border px-4 py-2">{parametros[modelo][ex].velocidadeDescida ?? '-'}</td>
                        <td className="border px-4 py-2">{parametros[modelo][ex].tempoExecucao ?? '-'}</td>
                        <td className="border px-4 py-2"><Button size="sm" variant="outline" onClick={() => handleEdit(modelo, ex)}>Editar</Button></td>
                      </>
                    )}
                  </tr>
                ))
              ))}
              {adicionando && (
                <tr className="bg-green-50">
                  <td className="border px-2 py-2">
                    <select name="modelo" value={novaLinha.modelo} onChange={handleNovaLinhaChange} className="border rounded px-1">
                      {MODELOS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                  <td className="border px-2 py-2">
                    <select name="ex" value={novaLinha.ex} onChange={handleNovaLinhaChange} className="border rounded px-1">
                      {EXERCICIOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </td>
                  <td className="border px-2 py-2"><input name="carga" className="w-24 border rounded px-1" value={novaLinha.carga} onChange={handleNovaLinhaChange} /></td>
                  <td className="border px-2 py-2"><input name="anguloMax" type="number" className="w-16 border rounded px-1" value={novaLinha.anguloMax} onChange={handleNovaLinhaChange} /></td>
                  <td className="border px-2 py-2"><input name="anguloMin" type="number" className="w-16 border rounded px-1" value={novaLinha.anguloMin} onChange={handleNovaLinhaChange} /></td>
                  <td className="border px-2 py-2"><input name="amplitude" type="number" className="w-16 border rounded px-1" value={novaLinha.amplitude} onChange={handleNovaLinhaChange} /></td>
                  <td className="border px-2 py-2"><input name="velocidadeSubida" type="number" step="0.01" className="w-16 border rounded px-1" value={novaLinha.velocidadeSubida} onChange={handleNovaLinhaChange} /></td>
                  <td className="border px-2 py-2"><input name="velocidadeDescida" type="number" step="0.01" className="w-16 border rounded px-1" value={novaLinha.velocidadeDescida} onChange={handleNovaLinhaChange} /></td>
                  <td className="border px-2 py-2"><input name="tempoExecucao" type="number" step="0.01" className="w-16 border rounded px-1" value={novaLinha.tempoExecucao} onChange={handleNovaLinhaChange} /></td>
                  <td className="border px-2 py-2"><Button size="sm" onClick={handleSalvarNovaLinha}>Salvar</Button></td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="outline" onClick={handleAddLinha} disabled={adicionando}>Adicionar linha</Button>
          </div>
          <div className="mt-8 text-gray-500 text-center text-sm">
            * Estes parâmetros são exemplos e podem ser ajustados conforme a metodologia do treinador ou atualização do app.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ParametrosTreino; 