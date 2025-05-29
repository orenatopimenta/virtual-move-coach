import React, { useState, useEffect } from 'react';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronRight, Trash2, Lock, Play, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const METRICAS_USUARIO = [
  { nome: 'Treinos por semana', valor: 2 },
  { nome: 'Tempo médio por treino', valor: '35 min' },
  { nome: 'Áreas mais treinadas', valor: 'Pernas, Braços' },
  { nome: 'Séries por treino', valor: 12 },
];

const METRICAS_IA = [
  { nome: 'Treinos recomendados por semana', valor: 3 },
  { nome: 'Tempo recomendado por treino', valor: '45 min' },
  { nome: 'Áreas a focar', valor: 'Costas, Abdômen' },
  { nome: 'Séries recomendadas', valor: 15 },
];

const LOCAIS = ['Casa', 'Academia', 'Ar livre'];
const DIAS_OPCOES = [2, 3, 4, 5, 6];
export const MODELOS = ['Iniciante', 'Resistência', 'Aesthetics', 'Glúteos +', 'IFBB Pro', 'Pilates Slim'];

const EXERCICIOS_EXEMPLO = [
  { area: 'Pernas', exercicios: ['Agachamento', 'Avanço', 'Leg Press'] },
  { area: 'Braços', exercicios: ['Rosca Bíceps', 'Tríceps'] },
  { area: 'Peito', exercicios: ['Supino', 'Flexão de Braço'] },
];

// Lista de referência de todos os exercícios usados no app
const TODOS_EXERCICIOS = [
  { id: 'agachamento', name: 'Agachamento' },
  { id: 'afundo', name: 'Avanço' },
  { id: 'leg-press', name: 'Leg Press' },
  { id: 'cadeira-extensora', name: 'Cadeira Extensora' },
  { id: 'curl', name: 'Rosca Bíceps' },
  { id: 'hammer-curl', name: 'Rosca Hammer' },
  { id: 'triceps', name: 'Extensão de Tríceps' },
  { id: 'rosca-triceps', name: 'Rosca Tríceps' },
  { id: 'pushup', name: 'Flexão de Braço' },
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

const TreinoIA: React.FC = () => {
  const [local, setLocal] = useState('Casa');
  const [carga, setCarga] = useState(0);
  const [semCarga, setSemCarga] = useState(true);
  const [diasSemana, setDiasSemana] = useState(3);
  const [modelo, setModelo] = useState('Iniciante');
  const [etapa, setEtapa] = useState<'form' | 'modelo' | 'mes' | 'semana' | 'exercicios'>('form');
  const [mesSelecionado, setMesSelecionado] = useState<number | null>(null);
  const [semanaSelecionada, setSemanaSelecionada] = useState<number | null>(null);
  const [treinosIA, setTreinosIA] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('treinosIA');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [treinoExpandido, setTreinoExpandido] = useState<number | null>(null);
  const [formVisivel, setFormVisivel] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState<number | false>(false);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [mesesDesbloqueados, setMesesDesbloqueados] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mesesDesbloqueados');
      return saved ? JSON.parse(saved) : [1];
    }
    return [1];
  });
  const [modeloSelecionado, setModeloSelecionado] = useState<string>('');
  const [exerciciosPorSemana, setExerciciosPorSemana] = useState<Record<string, string[]>>({});
  const [modalExecucao, setModalExecucao] = useState<{exercicio: any, area: string} | null>(null);
  const [modalModelo, setModalModelo] = useState(MODELOS[0]);
  const [modalCarga, setModalCarga] = useState(0);
  const [modalSemCarga, setModalSemCarga] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mesesDesbloqueados', JSON.stringify(mesesDesbloqueados));
    }
  }, [mesesDesbloqueados]);

  useEffect(() => {
    const fetchTreinosIA = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('treino_ia')
          .select('*')
          .eq('user_id', user.id)
          .eq('ativo', true);
        if (!error && data) {
          setTreinosIA(data);
          localStorage.setItem('treinosIA', JSON.stringify(data));
        }
      }
    };
    fetchTreinosIA();
  }, []);

  const handleCargaChange = (delta: number) => {
    setCarga((prev) => Math.max(0, prev + delta));
    setSemCarga(false);
  };

  const getSemanaKey = (mes: number, semana: number) => `${mes}-${semana}`;

  const handleSemanaClick = (mes: number, semana: number) => {
    setSemanaSelecionada(semana);
    const key = getSemanaKey(mes, semana);
    if (!exerciciosPorSemana[key]) {
      const lista = EXERCICIOS_EXEMPLO.flatMap(area => area.exercicios);
      setExerciciosPorSemana(prev => ({ ...prev, [key]: lista }));
    }
  };

  const moverExercicio = (key: string, idx: number, dir: -1 | 1) => {
    setExerciciosPorSemana(prev => {
      const lista = [...(prev[key] || [])];
      const novoIdx = idx + dir;
      if (novoIdx < 0 || novoIdx >= lista.length) return prev;
      [lista[idx], lista[novoIdx]] = [lista[novoIdx], lista[idx]];
      return { ...prev, [key]: lista };
    });
  };

  // Função para inativar treino IA
  const inativarTreinoIA = async (id: string) => {
    const { error } = await supabase
      .from('treino_ia')
      .update({ ativo: false })
      .eq('id', id);
    if (!error) {
      setTreinosIA(prev => prev.filter(t => t.id !== id));
      // Ou chame fetchTreinosIA() para recarregar da base
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow flex flex-col items-center justify-center py-8">
        {/* Botão de retorno */}
        <div className="w-full max-w-4xl mb-4 flex">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-md flex flex-row gap-8 items-start">
          {/* Menu lateral esquerdo */}
          <div className="flex flex-col items-start w-full md:w-1/3 max-w-xs">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-lg text-lg mb-4 w-full" onClick={() => setModalCriarAberto(true)}>
              Criar treino com IA
            </Button>
            {/* Modal de criação de treino com IA */}
            {modalCriarAberto && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                  <h2 className="text-lg font-bold mb-4">Criar treino com IA</h2>
                  <form className="space-y-6" onSubmit={async e => {
                    e.preventDefault();
                    const novoTreino = {
                      modelo,
                      local,
                      carga: semCarga ? null : carga,
                      diasSemana,
                      criadoEm: Date.now(),
                      progresso: { mes: 1, semana: 1 },
                    };
                    setTreinosIA(prev => {
                      const atualizados = [...prev, novoTreino];
                      localStorage.setItem('treinosIA', JSON.stringify(atualizados));
                      return atualizados;
                    });
                    // Salvar no Supabase
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        // Montar objeto de semanas (exemplo: semana_1, semana_2, ... semana_24)
                        const semanas = {};
                        for (let i = 1; i <= 24; i++) {
                          semanas[`semana_${i}`] = null; // ou preencha conforme sua lógica
                        }
                        await supabase.from('treino_ia').insert([
                          {
                            user_id: user.id,
                            modelo,
                            local,
                            carga: semCarga ? null : carga,
                            dias_semana: diasSemana,
                            ...semanas
                          }
                        ]);
                      }
                    } catch (err) {
                      // Pode exibir um toast/alerta se quiser
                      console.error('Erro ao salvar treino IA no Supabase:', err);
                    }
                    setModeloSelecionado(modelo);
                    setTreinoExpandido(treinosIA.length);
                    setModalCriarAberto(false);
                    setMesSelecionado(null);
                    setSemanaSelecionada(null);
                  }}>
                    {/* Modelo de treino */}
                    <div>
                      <label className="block mb-2 font-medium">Modelo de treino</label>
                      <select
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-formfit-blue"
                        value={modelo}
                        onChange={e => setModelo(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {MODELOS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    {/* Local do treino */}
                    <div>
                      <label className="block mb-2 font-medium">Onde você vai treinar?</label>
                      <div className="flex gap-2 justify-center">
                        {LOCAIS.map((l) => (
                          <Button
                            key={l}
                            type="button"
                            variant={local === l ? 'default' : 'outline'}
                            className={local === l ? 'bg-purple-600 text-white' : ''}
                            onClick={() => setLocal(l)}
                          >
                            {l}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {/* Carga */}
                    <div>
                      <label className="block mb-2 font-medium">Carga</label>
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (carga > 0) setCarga(carga - 1);
                            setSemCarga(false);
                          }}
                          disabled={semCarga || carga === 0}
                        >
                          -
                        </Button>
                        <span className="text-2xl font-bold min-w-[3rem] text-center">{semCarga ? 'Sem carga' : `${carga} kg`}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => { setCarga(carga + 1); setSemCarga(false); }}
                        >
                          +
                        </Button>
                        <Button
                          type="button"
                          variant={semCarga ? 'default' : 'outline'}
                          className={semCarga ? 'bg-purple-600 text-white' : ''}
                          onClick={() => { setSemCarga(true); setCarga(0); }}
                        >
                          Sem carga
                        </Button>
                      </div>
                    </div>
                    {/* Dias da semana */}
                    <div>
                      <label className="block mb-2 font-medium">Dias da semana</label>
                      <div className="flex gap-2 justify-center">
                        {DIAS_OPCOES.map((d) => (
                          <Button
                            key={d}
                            type="button"
                            variant={diasSemana === d ? 'default' : 'outline'}
                            className={diasSemana === d ? 'bg-purple-600 text-white' : ''}
                            onClick={() => setDiasSemana(d)}
                          >
                            {d}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" type="button" onClick={() => setModalCriarAberto(false)}>Cancelar</Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold">Gerar treino com IA</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {treinosIA.map((treino, idx) => (
              <div key={treino.criadoEm} className="w-full flex items-center gap-2 mb-2 max-w-xs">
                <Button className="flex-1 bg-purple-100 text-purple-700 font-bold px-4 py-1 text-sm text-left" onClick={() => setTreinoExpandido(treinoExpandido === idx ? null : idx)}>
                  {treino.modelo}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setModalExcluirAberto(idx)} aria-label="Excluir modelo">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </Button>
                {/* Modal de confirmação de exclusão */}
                {modalExcluirAberto === idx && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                      <h2 className="text-lg font-bold mb-4">Excluir modelo</h2>
                      <p className="mb-6">Tem certeza que deseja excluir este modelo de treino? Esta ação não pode ser desfeita.</p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setModalExcluirAberto(false)}>Cancelar</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={async () => {
                          await inativarTreinoIA(treino.id);
                          setModalExcluirAberto(false);
                        }}>
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {treinoExpandido !== null && treinosIA[treinoExpandido] && (
              <div className="w-full flex flex-col gap-2 max-w-xs items-start">
                {[1,2,3,4,5,6].map(mes => {
                  const desbloqueado = mesesDesbloqueados.includes(mes);
                  return (
                    <React.Fragment key={mes}>
                      <Button
                        className={`w-full flex justify-between items-center px-4 py-1 text-sm text-left ${mesSelecionado === mes ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700'} ${!desbloqueado ? 'opacity-60 cursor-not-allowed' : ''}`}
                        onClick={() => desbloqueado && setMesSelecionado(mesSelecionado === mes ? null : mes)}
                        disabled={!desbloqueado}
                      >
                        <span className="flex items-center gap-2">
                          {mes}º mês
                          {!desbloqueado && <Lock className="w-4 h-4 text-gray-500" />}
                        </span>
                        {desbloqueado && (mesSelecionado === mes ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />)}
                      </Button>
                      {mesSelecionado === mes && desbloqueado && (
                        <div className="mt-2 flex flex-col gap-2 ml-4 items-start">
                          {[1,2,3,4].map(semana => (
                            <Button
                              key={semana}
                              className={`w-full px-4 py-1 text-sm text-left ${semanaSelecionada === semana ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700'}`}
                              onClick={() => {
                                setSemanaSelecionada(semana);
                                handleSemanaClick(mes, semana);
                                if (semana === 4 && !mesesDesbloqueados.includes(mes + 1) && mes < 6) {
                                  setMesesDesbloqueados(prev => [...prev, mes + 1]);
                                }
                              }}
                            >
                              {semana}ª semana
                            </Button>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
          {/* Conteúdo principal à direita */}
          <div className="flex-1 flex flex-col">
            {semanaSelecionada && treinoExpandido !== null && treinosIA[treinoExpandido] && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Exercícios da {semanaSelecionada}ª semana do {mesSelecionado}º mês</h2>
                {/* Buscar exercícios reais do campo semana_X do treino selecionado */}
                {(() => {
                  const treinoSelecionado = treinosIA[treinoExpandido];
                  // Calcular o índice da semana global (1 a 24)
                  const semanaGlobal = (mesSelecionado - 1) * 4 + semanaSelecionada;
                  const semanaKey = `semana_${semanaGlobal}`;
                  const semanaData = treinoSelecionado[semanaKey];
                  // Aceitar formato antigo e novo
                  const exercicios = Array.isArray(semanaData)
                    ? semanaData
                    : semanaData && Array.isArray(semanaData.exercicios)
                      ? semanaData.exercicios
                      : [];
                  if (exercicios.length === 0) {
                    return <div className="text-gray-500">Nenhum exercício cadastrado para esta semana.</div>;
                  }
                  // Função para mover exercício na lista local
                  const moverExercicio = (area: string, idx: number, dir: -1 | 1) => {
                    setTreinosIA(prev => {
                      const novos = [...prev];
                      const treino = novos[treinoExpandido];
                      const semanaDataLocal = treino[semanaKey];
                      if (!semanaDataLocal) return prev;
                      const areaObj = semanaDataLocal.find((a: any) => a.area === area);
                      if (!areaObj) return prev;
                      const lista = [...areaObj.exercicios];
                      const novoIdx = idx + dir;
                      if (novoIdx < 0 || novoIdx >= lista.length) return prev;
                      [lista[idx], lista[novoIdx]] = [lista[novoIdx], lista[idx]];
                      areaObj.exercicios = lista;
                      return novos;
                    });
                  };
                  // Função para abrir modal de execução preenchido
                  const iniciarExecucao = (ex: any, area: string) => {
                    setModalExecucao({
                      exercicio: typeof ex === 'object' ? ex : { id: ex, name: ex },
                      area
                    });
                    setModalModelo(modelo);
                    setModalCarga(ex.series || 0);
                    setModalSemCarga(!ex.series);
                  };
                  return (
                    <ul className="space-y-2">
                      {exercicios.map((item: any, idx: number) => (
                        <React.Fragment key={idx}>
                          {Array.isArray(item.exercicios) && item.exercicios.map((ex: any, i: number, arr: any[]) => {
                            const exId = typeof ex === 'string' ? ex : ex.id;
                            const exInfo = TODOS_EXERCICIOS.find(e => e.id === exId);
                            const nome = exInfo ? exInfo.name : exId;
                            const series = typeof ex === 'object' && ex.series ? ex.series : '';
                            return (
                              <li key={i} className="flex items-center justify-between gap-2 bg-gray-100 rounded px-3 py-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{nome}</span>
                                  <span className="ml-2 text-xs text-gray-500">({item.area})</span>
                                  {series && <span className="ml-2 text-xs text-gray-500">{series} séries</span>}
                                </div>
                                <div className="flex gap-1 items-center">
                                  <Button size="icon" variant="ghost" onClick={() => moverExercicio(item.area, i, -1)} disabled={i === 0} title="Mover para cima">
                                    <ArrowUp className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => moverExercicio(item.area, i, 1)} disabled={i === arr.length - 1} title="Mover para baixo">
                                    <ArrowDown className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" className="bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg" onClick={() => iniciarExecucao(ex, item.area)} title="Iniciar exercício">
                                    <Play className="w-5 h-5" />
                                  </Button>
                                </div>
                              </li>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </ul>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Cards de métricas centralizados abaixo do layout principal */}
      <div className="w-full flex justify-center mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
          <Card>
            <CardHeader>
              <CardTitle>Suas Métricas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {METRICAS_USUARIO.map((m, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{m.nome}</span>
                    <span className="font-semibold">{m.valor}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Métricas Recomendadas pela IA</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {METRICAS_IA.map((m, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{m.nome}</span>
                    <span className="font-semibold text-purple-700">{m.valor}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
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
                // Buscar nome correto do exercício
                const TODOS_EXERCICIOS = [
                  { id: 'agachamento', name: 'Agachamento' },
                  { id: 'afundo', name: 'Avanço' },
                  { id: 'leg-press', name: 'Leg Press' },
                  { id: 'cadeira-extensora', name: 'Cadeira Extensora' },
                  { id: 'curl', name: 'Rosca Bíceps' },
                  { id: 'hammer-curl', name: 'Rosca Hammer' },
                  { id: 'triceps', name: 'Extensão de Tríceps' },
                  { id: 'rosca-triceps', name: 'Rosca Tríceps' },
                  { id: 'pushup', name: 'Flexão de Braço' },
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
                const exInfo = TODOS_EXERCICIOS.find(e => e.id === modalExecucao.exercicio.id) || { id: modalExecucao.exercicio.id, name: modalExecucao.exercicio.name || modalExecucao.exercicio.id };
                localStorage.setItem("currentExercise", JSON.stringify({
                  id: exInfo.id,
                  name: exInfo.name,
                  modelo: modalModelo,
                  carga: modalSemCarga ? null : modalCarga,
                  area: modalExecucao.area,
                  series: modalExecucao.exercicio.series || null
                }));
                setModalExecucao(null);
                navigate('/workout-flow/execution');
              }} title="Iniciar exercício"><Play className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default TreinoIA; 