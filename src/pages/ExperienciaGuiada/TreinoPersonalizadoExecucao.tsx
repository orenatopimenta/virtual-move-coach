import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUp, ArrowDown, Play } from 'lucide-react';
import { MODELOS } from '../TreinoIA';
import deburr from 'lodash/deburr';
import { supabase } from '@/lib/supabaseClient';

// Exercícios padrão por área (mesmo do dashboard)
const EXERCICIOS_POR_AREA: Record<string, { id: string, name: string }[]> = {
  'Pernas': [
    { id: 'agachamento', name: 'Agachamento' },
    { id: 'afundo', name: 'Avanço' },
    { id: 'leg-press', name: 'Leg Press' },
    { id: 'cadeira-extensora', name: 'Cadeira Extensora' },
  ],
  'Braços': [
    { id: 'curl', name: 'Rosca Bíceps' },
    { id: 'hammer-curl', name: 'Rosca Hammer' },
    { id: 'triceps', name: 'Extensão de Tríceps' },
    { id: 'rosca-triceps', name: 'Rosca Tríceps' },
  ],
  'Peito': [
    { id: 'pushup', name: 'Flexão de Braço' },
    { id: 'supino', name: 'Supino' },
    { id: 'crossover', name: 'Crossover' },
    { id: 'crossover-baixo', name: 'Crossover Baixo' },
  ],
  'Costas': [
    { id: 'remada', name: 'Remada' },
    { id: 'lat-push', name: 'Lat Push' },
    { id: 'lat-pull', name: 'Lat Pull' },
    { id: 'seated-row', name: 'Seated Row' },
  ],
  'Abdômen': [
    { id: 'abdominal', name: 'Abdominal' },
  ],
  'Ombros': [
    { id: 'levantamento-lateral', name: 'Levantamento Lateral' },
    { id: 'levantamento-frontal', name: 'Levantamento Frontal' },
    { id: 'desenvolvimento', name: 'Desenvolvimento' },
    { id: 'crucifixo-invertido', name: 'Crucifixo Invertido' },
  ],
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const TreinoPersonalizadoExecucao: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const nomeTreino = query.get('treino') || '';
  const [exercicios, setExercicios] = useState<{ area: string, ex: { id: string, name: string } }[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [modalExecucao, setModalExecucao] = useState<{exercicio: { id: string, name: string }, area: string} | null>(null);
  const [modalModelo, setModalModelo] = useState(MODELOS[0]);
  const [modalCarga, setModalCarga] = useState(0);
  const [modalSemCarga, setModalSemCarga] = useState(true);
  const [treinosIA, setTreinosIA] = useState([]);

  useEffect(() => {
    if (!nomeTreino) {
      console.error('Parâmetro "treino" não encontrado na URL.');
      setErro('Parâmetro de treino não informado. Volte e selecione um treino personalizado.');
      setExercicios([]);
      return;
    }
    try {
      // Buscar treinos do localStorage
      const treinosSalvos = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('treinosPersonalizados') || '[]') : [];
      if (!Array.isArray(treinosSalvos)) throw new Error('Formato inválido nos treinos salvos.');
      const treino = treinosSalvos.find((t: any) => t.nome === nomeTreino);
      if (!treino || !Array.isArray(treino.treinos)) throw new Error('Treino não encontrado.');
      let lista: { area: string, ex: { id: string, name: string } }[] = [];
      treino.treinos.forEach((t: any) => {
        (EXERCICIOS_POR_AREA[t.area] || []).forEach(ex => {
          if ((t.exercicios || []).includes(ex.id)) {
            lista.push({ area: t.area, ex });
          }
        });
      });
      setExercicios(lista);
      setErro(null);
    } catch (e: any) {
      setErro('Não foi possível carregar os treinos personalizados. Por favor, configure novamente seu treino personalizado.');
      setExercicios([]);
    }
  }, [nomeTreino]);

  useEffect(() => {
    const fetchTreinosIA = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('treino_ia')
          .select('*')
          .eq('user_id', user.id);
        if (!error && data) {
          setTreinosIA(data);
          // Se quiser, também pode atualizar o localStorage:
          localStorage.setItem('treinosIA', JSON.stringify(data));
        }
      }
    };
    fetchTreinosIA();
  }, []);

  // Função para reordenar exercícios
  const move = (from: number, to: number) => {
    if (to < 0 || to >= exercicios.length) return;
    const newList = [...exercicios];
    const [item] = newList.splice(from, 1);
    newList.splice(to, 0, item);
    setExercicios(newList);
  };

  async function salvarTreinoPersonalizado({ user_id, nome, exercicios }) {
    const { data, error } = await supabase
      .from('treino_personalizado')
      .insert([
        {
          user_id,
          nome,
          exercicios, // deve ser um objeto/array, será salvo como JSON
        }
      ]);
    if (error) throw error;
    return data;
  }

  async function salvarTreinoIA({ user_id, modelo, local, carga, dias_semana, semanas }) {
    // semanas: objeto { semana_1: {...}, semana_2: {...}, ... }
    const insertData = {
      user_id,
      modelo,
      local,
      carga,
      dias_semana,
      ...semanas // cada semana_x é um campo jsonb
    };
    const { data, error } = await supabase
      .from('treino_ia')
      .insert([insertData]);
    if (error) throw error;
    return data;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <div className="mb-4 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-center flex-1">Treino Personalizado - {nomeTreino}</h1>
          </div>
          <div className="mb-6">
            <div className="font-semibold mb-2">Exercícios do dia:</div>
            {erro ? (
              <div className="text-red-600 text-center font-semibold py-4">{erro}</div>
            ) : (
              <ul className="space-y-2">
                {exercicios.map((item, idx) => (
                  <li key={item.ex.id + idx} className="flex items-center justify-between bg-gray-100 rounded px-3 py-2">
                    <div>
                      <span className="font-medium">{item.ex.name}</span>
                      <span className="ml-2 text-xs text-gray-500">({item.area})</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => move(idx, idx-1)} disabled={idx === 0}><ArrowUp /></Button>
                      <Button variant="ghost" size="icon" onClick={() => move(idx, idx+1)} disabled={idx === exercicios.length-1}><ArrowDown /></Button>
                      <Button variant="default" size="icon" onClick={() => {
                        setModalExecucao({ exercicio: item.ex, area: item.area });
                        setModalModelo(MODELOS[0]);
                        setModalCarga(0);
                        setModalSemCarga(true);
                      }}><Play /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      {modalExecucao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Configurar Execução</h2>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Modelo de treino</label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-formfit-blue"
                value={modalModelo}
                onChange={e => setModalModelo(e.target.value)}
              >
                {MODELOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Carga</label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (modalCarga > 0) setModalCarga(modalCarga - 1);
                    setModalSemCarga(false);
                  }}
                  disabled={modalSemCarga || modalCarga === 0}
                >
                  -
                </Button>
                <span className="text-2xl font-bold min-w-[3rem] text-center">{modalSemCarga ? 'Sem carga' : `${modalCarga} kg`}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => { setModalCarga(modalCarga + 1); setModalSemCarga(false); }}
                >
                  +
                </Button>
                <Button
                  type="button"
                  variant={modalSemCarga ? 'default' : 'outline'}
                  className={modalSemCarga ? 'bg-purple-600 text-white' : ''}
                  onClick={() => { setModalSemCarga(true); setModalCarga(0); }}
                >
                  Sem carga
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setModalExecucao(null)}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-bold" onClick={() => {
                // Normalização igual ao Workout.tsx
                const normalize = (str) => deburr(str || '').toLowerCase();
                // Lista de referência igual ao Workout.tsx
                const TODOS_EXERCICIOS = [
                  { id: 'squat', name: 'Agachamento' },
                  { id: 'agachamento', name: 'Agachamento' },
                  { id: 'push-up', name: 'Flexão de Braço' },
                  { id: 'pushup', name: 'Flexão de Braço' },
                  { id: 'flexao', name: 'Flexão de Braço' },
                  { id: 'biceps-curl', name: 'Rosca Bíceps' },
                  { id: 'curl', name: 'Rosca Bíceps' },
                  { id: 'afundo', name: 'Avanço' },
                  { id: 'leg-press', name: 'Leg Press' },
                  { id: 'cadeira-extensora', name: 'Cadeira Extensora' },
                  { id: 'hammer-curl', name: 'Rosca Hammer' },
                  { id: 'triceps', name: 'Extensão de Tríceps' },
                  { id: 'rosca-triceps', name: 'Rosca Tríceps' },
                  { id: 'supino', name: 'Supino' },
                  { id: 'crossover', name: 'Crossover' },
                  { id: 'crossover-baixo', name: 'Crossover Baixo' },
                  { id: 'remada', name: 'Remada' },
                  { id: 'lat-push', name: 'Lat Push' },
                  { id: 'lat-pull', name: 'Lat Pull' },
                  { id: 'seated-row', name: 'Seated Row' },
                  { id: 'abdominal', name: 'Abdominal' },
                  { id: 'levantamento-lateral', name: 'Levantamento Lateral' },
                  { id: 'levantamento-frontal', name: 'Levantamento Frontal' },
                  { id: 'desenvolvimento', name: 'Desenvolvimento' },
                  { id: 'crucifixo-invertido', name: 'Crucifixo Invertido' },
                ];
                const exercicioObj = TODOS_EXERCICIOS.find(
                  e => normalize(e.id) === normalize(modalExecucao.exercicio.id) || normalize(e.name) === normalize(modalExecucao.exercicio.name)
                ) || { id: normalize(modalExecucao.exercicio.id), name: modalExecucao.exercicio.name };
                const toSave = {
                  id: exercicioObj.id,
                  name: exercicioObj.name,
                  modelo: modalModelo,
                  carga: modalSemCarga ? null : modalCarga,
                  area: modalExecucao.area
                };
                console.log('Salvando no localStorage (personalizado):', toSave);
                localStorage.setItem("currentExercise", JSON.stringify(toSave));
                setModalExecucao(null);
                navigate('/workout-flow/execution');
              }}>Iniciar</Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default TreinoPersonalizadoExecucao; 