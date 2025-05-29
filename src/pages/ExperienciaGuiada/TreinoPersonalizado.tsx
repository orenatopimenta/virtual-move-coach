import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowDown, ArrowRight, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const diasSemana = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const opcoesTreino = [
  'Pernas',
  'Braços',
  'Peito',
  'Costas',
  'Ombros',
  'Abdômen',
];

// Exercícios padrão por área
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

type TreinoPersonalizadoType = {
  nome: string;
  dia: string;
  treinos: {
    area: string;
    exercicios: string[]; // ids dos exercícios selecionados
  }[];
};

const STORAGE_KEY = 'treinosPersonalizados';

const TreinoPersonalizado: React.FC = () => {
  const navigate = useNavigate();
  const [diaSelecionado, setDiaSelecionado] = useState('');
  const [treinosSelecionados, setTreinosSelecionados] = useState<string[]>([]);
  const [treinosSalvos, setTreinosSalvos] = useState<TreinoPersonalizadoType[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [nomeTreino, setNomeTreino] = useState('');
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState<Record<string, string[]>>({});
  const [treinoExpandido, setTreinoExpandido] = useState<number | null>(null);
  const [treinoParaExcluir, setTreinoParaExcluir] = useState<number | null>(null);

  useEffect(() => {
    const salvos = localStorage.getItem(STORAGE_KEY);
    if (salvos) {
      setTreinosSalvos(JSON.parse(salvos));
    }
  }, []);

  const handleAreaChange = (area: string) => {
    if (treinosSelecionados.includes(area)) {
      setTreinosSelecionados(treinosSelecionados.filter(a => a !== area));
      setExerciciosSelecionados(prev => {
        const novo = { ...prev };
        delete novo[area];
        return novo;
      });
    } else {
      setTreinosSelecionados([...treinosSelecionados, area]);
      setExerciciosSelecionados(prev => ({
        ...prev,
        [area]: [],
      }));
    }
  };

  const handleExercicioChange = (area: string, exId: string) => {
    setExerciciosSelecionados(prev => {
      const selecionados = prev[area] || [];
      if (selecionados.includes(exId)) {
        return { ...prev, [area]: selecionados.filter(id => id !== exId) };
      } else {
        return { ...prev, [area]: [...selecionados, exId] };
      }
    });
  };

  const handleSelecionarTodos = (area: string) => {
    const todos = (EXERCICIOS_POR_AREA[area] || []).map(ex => ex.id);
    setExerciciosSelecionados(prev => {
      const selecionados = prev[area] || [];
      if (selecionados.length === todos.length) {
        // Desmarcar todos
        return { ...prev, [area]: [] };
      } else {
        // Marcar todos
        return { ...prev, [area]: todos };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Montar estrutura de treinos com exercícios selecionados
    const treinos = treinosSelecionados.map(area => ({
      area,
      exercicios: exerciciosSelecionados[area] || [],
    }));
    let novosTreinos;
    if (editIndex !== null) {
      // Editando treino existente
      novosTreinos = treinosSalvos.map((t, idx) =>
        idx === editIndex ? { nome: nomeTreino, dia: diaSelecionado, treinos } : t
      );
    } else {
      // Adicionando novo treino
      novosTreinos = [
        ...treinosSalvos,
        { nome: nomeTreino, dia: diaSelecionado, treinos },
      ];
      // Salvar no Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('treino_personalizado').insert([
            {
              user_id: user.id,
              nome: nomeTreino,
              exercicios: treinos,
            }
          ]);
        }
      } catch (err) {
        // Pode exibir um toast/alerta se quiser
        console.error('Erro ao salvar treino no Supabase:', err);
      }
    }
    setTreinosSalvos(novosTreinos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novosTreinos));
    setNomeTreino('');
    setDiaSelecionado('');
    setTreinosSelecionados([]);
    setExerciciosSelecionados({});
    setEditIndex(null);
  };

  const handleEdit = (idx: number) => {
    const treino = treinosSalvos[idx];
    setNomeTreino(treino.nome || '');
    setDiaSelecionado(treino.dia || '');
    setTreinosSelecionados(Array.isArray(treino.treinos) ? treino.treinos.map(t => t.area) : []);
    setExerciciosSelecionados(() => {
      const obj: Record<string, string[]> = {};
      if (Array.isArray(treino.treinos)) {
        treino.treinos.forEach(t => {
          obj[t.area] = Array.isArray(t.exercicios) ? t.exercicios : [];
        });
      }
      return obj;
    });
    setEditIndex(idx);
  };

  const handleDelete = (idx: number) => {
    const novosTreinos = treinosSalvos.filter((_, i) => i !== idx);
    setTreinosSalvos(novosTreinos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novosTreinos));
    if (editIndex === idx) {
      setEditIndex(null);
      setNomeTreino('');
      setDiaSelecionado('');
      setTreinosSelecionados([]);
      setExerciciosSelecionados({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <div className="mb-4 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <h1 className="text-2xl font-bold mb-6 text-center">Treino Personalizado</h1>

          {/* Lista de treinos salvos */}
          {treinosSalvos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Treinos Salvos</h2>
              <ul className="space-y-2">
                {treinosSalvos.map((treino, idx) => {
                  return (
                    <li key={idx} className="flex flex-col bg-gray-100 rounded px-3 py-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTreinoExpandido(treinoExpandido === idx ? null : idx)}
                            className="p-1"
                            aria-label={treinoExpandido === idx ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                          >
                            {treinoExpandido === idx ? <ArrowDown size={16} /> : <ArrowRight size={16} />}
                          </button>
                          <span className="font-medium">{treino.nome || 'Sem nome'}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(idx)}>
                            Editar
                          </Button>
                          <button
                            type="button"
                            className="p-1 text-red-600 hover:text-red-800"
                            onClick={() => setTreinoParaExcluir(idx)}
                            title="Excluir treino"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {treinoExpandido === idx && Array.isArray(treino.treinos) && (
                        <div className="mt-2 text-sm text-gray-700">
                          <ul className="ml-2 space-y-1">
                            {treino.treinos.map((t, i) => (
                              <li key={i}>
                                <span className="font-semibold">{t.area}:</span>
                                <ul className="list-none text-left ml-0">
                                  {(t.exercicios || []).map((exId, j) => {
                                    const ex = (EXERCICIOS_POR_AREA[t.area] || []).find(e => e.id === exId);
                                    return <li key={j}>{ex ? ex.name : exId}</li>;
                                  })}
                                </ul>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">Nome do treino:</label>
              <input
                className="w-full border rounded px-3 py-2"
                type="text"
                value={nomeTreino}
                onChange={e => setNomeTreino(e.target.value)}
                required
                placeholder="Ex: Treino de Segunda, Treino A, etc."
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Selecione o dia da semana:</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={diaSelecionado}
                onChange={(e) => setDiaSelecionado(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {diasSemana.map((dia) => (
                  <option key={dia} value={dia}>{dia}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium">Opções de treino:</label>
              <div className="flex flex-wrap gap-3">
                {opcoesTreino.map((opcao) => (
                  <div key={opcao} className="w-full">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={treinosSelecionados.includes(opcao)}
                        onChange={() => handleAreaChange(opcao)}
                      />
                      {opcao}
                    </label>
                    {treinosSelecionados.includes(opcao) && (
                      <div className="ml-6 mt-1">
                        <label className="flex items-center gap-2 text-xs mb-1 cursor-pointer text-blue-600">
                          <input
                            type="checkbox"
                            checked={(exerciciosSelecionados[opcao] || []).length === (EXERCICIOS_POR_AREA[opcao] || []).length && (EXERCICIOS_POR_AREA[opcao] || []).length > 0}
                            onChange={() => handleSelecionarTodos(opcao)}
                          />
                          {(exerciciosSelecionados[opcao] || []).length === (EXERCICIOS_POR_AREA[opcao] || []).length ? 'Desmarcar todos' : 'Selecionar todos'}
                        </label>
                        <ul className="text-sm text-gray-600">
                          {(EXERCICIOS_POR_AREA[opcao] || []).map(ex => (
                            <li key={ex.id}>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={(exerciciosSelecionados[opcao] || []).includes(ex.id)}
                                  onChange={() => handleExercicioChange(opcao, ex.id)}
                                />
                                {ex.name}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
              {editIndex !== null ? 'Salvar Edição' : 'Salvar Treino'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
      {treinoParaExcluir !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs text-center">
            <h2 className="text-lg font-bold mb-4">Excluir treino</h2>
            <p className="mb-6">Tem certeza que deseja excluir este treino?</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setTreinoParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  handleDelete(treinoParaExcluir);
                  setTreinoParaExcluir(null);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreinoPersonalizado; 