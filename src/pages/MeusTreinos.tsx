import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ChartContainer } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MODELOS } from './TreinoIA';

const AREAS = [
  'Pernas',
  'Braços',
  'Ombros',
  'Peito',
  'Costas',
  'Abdômen',
];

// Mapeamento simples de exercícios para áreas
const EXERCICIO_AREA: Record<string, string> = {
  'Agachamento': 'Pernas',
  'Leg Press': 'Pernas',
  'Rosca Bíceps': 'Braços',
  'Tríceps': 'Braços',
  // Adicione mais mapeamentos conforme necessário
};

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1)/7);
}

// Função para obter semana/ano de uma data
function getSemanaAno(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const week = getWeekNumber(d);
  const year = d.getUTCFullYear();
  return { week, year };
}

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

// Função utilitária para remover duplicatas por exercício, série e repetição
function removeDuplicateMetrics(metrics) {
  const seen = new Set();
  return (metrics || []).filter((m) => {
    const key = `${m.exercise_name}-${m.series_number}-${m.repetition_number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Função para filtrar métricas por dia
function filterMetricsByDay(metrics, treinos, ex, dia) {
  if (!dia || !ex) return [];
  const normalize = (str) => (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  console.log('Chaves de treinos:', Object.keys(treinos));
  console.log('selectedExercise.data:', dia);
  const treinosData = treinos[dia] || [];
  // Log sets do dia e métricas para depuração
  console.log('Sets do dia:', treinosData);
  console.log('Métricas disponíveis:', metrics);
  // Filtrar métricas pelo nome do exercício e, se houver, pelo campo de data igual ao dia selecionado
  return (metrics || []).filter((m) => {
    const matchEx = normalize(m.exercise_name) === normalize(ex.nome);
    // Se a métrica tiver campo de data, filtrar também pelo dia
    if (m.date) {
      return matchEx && m.date.split('T')[0] === dia;
    }
    return matchEx;
  });
}

// Função utilitária para buscar parâmetros do exercício/modelo
function getParametrosTreino(modelo: string, exercicio: string) {
  let parametros: any = {};
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('parametrosTreino');
    if (saved) parametros = JSON.parse(saved);
  }
  if (!parametros || !parametros[modelo] || !parametros[modelo][exercicio]) {
    // fallback para padrão
    parametros = {
      'Iniciante': {
        'Agachamento': { anguloMax: 120, anguloMin: 60, amplitude: 60, velocidadeSubida: 1.0, velocidadeDescida: 1.2, tempoExecucao: 2.2 },
        'Rosca Bíceps': { anguloMax: 110, anguloMin: 40, amplitude: 70, velocidadeSubida: 0.8, velocidadeDescida: 1.0, tempoExecucao: 1.8 },
        'Supino': { anguloMax: 100, anguloMin: 30, amplitude: 70, velocidadeSubida: 1.1, velocidadeDescida: 1.2, tempoExecucao: 2.3 },
      },
      'IFBB Pro': {
        'Agachamento': { anguloMax: 130, anguloMin: 50, amplitude: 80, velocidadeSubida: 0.9, velocidadeDescida: 1.1, tempoExecucao: 2.0 },
        'Rosca Bíceps': { anguloMax: 120, anguloMin: 30, amplitude: 90, velocidadeSubida: 0.7, velocidadeDescida: 0.9, tempoExecucao: 1.6 },
        'Supino': { anguloMax: 110, anguloMin: 20, amplitude: 90, velocidadeSubida: 1.0, velocidadeDescida: 1.1, tempoExecucao: 2.1 },
      },
    };
  }
  return parametros?.[modelo]?.[exercicio] || null;
}

// Função para calcular execuções boas para o indicador
function calcularExecucoesBoas(metrics: any[], indicador: string, parametro: number) {
  if (!parametro) return { boas: 0, total: 0 };
  let boas = 0;
  let total = 0;
  metrics.forEach(m => {
    const extra = m.extra_data || {};
    const valor = extra[indicador];
    if (valor !== undefined && valor !== null && typeof valor === 'number') {
      total++;
      if (valor >= parametro * 0.95 && valor <= parametro * 1.05) {
        boas++;
      }
    }
  });
  return { boas, total };
}

const MeusTreinos: React.FC = () => {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<'semana' | 'dia'>('semana');
  const [ano, setAno] = useState(new Date().getFullYear());
  const [semana, setSemana] = useState(getWeekNumber(new Date()));
  const [dia, setDia] = useState('');
  const [areaExpandida, setAreaExpandida] = useState<string | null>(null);
  const [treinos, setTreinos] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState<any[] | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<{ nome: string; area?: string; semana?: number; ano?: number; data?: string } | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [debugHistory, setDebugHistory] = useState<any>(null);
  const [debugSets, setDebugSets] = useState<any>(null);
  // Ref para a tabela de métricas
  const tabelaRef = React.useRef<HTMLDivElement>(null);
  // Função para scroll com offset
  function scrollToTabela() {
    if (tabelaRef.current) {
      const y = tabelaRef.current.getBoundingClientRect().top + window.scrollY - 80; // 80px de offset
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
  // Estado e label para o filtro do gráfico
  const [graficoIndicador, setGraficoIndicador] = React.useState('minAngle');
  function indicadorLabel(key: string) {
    switch (key) {
      case 'minAngle': return 'Ângulo Mínimo (º)';
      case 'maxAngle': return 'Ângulo Máximo (º)';
      case 'executionTime': return 'Tempo Execução (s)';
      case 'amplitude': return 'Amplitude (º)';
      case 'upVelocity': return 'Vel. Subida (º/s)';
      case 'downVelocity': return 'Vel. Descida (º/s)';
      default: return '';
    }
  }
  // Estado para série selecionada no filtro dia
  const [serieSelecionada, setSerieSelecionada] = React.useState<number>(1);
  const [modalExecucao, setModalExecucao] = useState<{exercicio: any} | null>(null);
  const [modalModelo, setModalModelo] = useState(MODELOS[0]);
  const [modalCarga, setModalCarga] = useState(0);
  const [modalSemCarga, setModalSemCarga] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Buscar workout_history e workout_sets
      const { data: history } = await supabase
        .from('workout_history')
        .select('id, date')
        .order('date', { ascending: false });
      const { data: sets } = await supabase
        .from('workout_sets')
        .select('workout_id, exercise_name, series_number, completed');
      // Agrupar por data
      const treinosPorData: Record<string, any[]> = {};
      (history || []).forEach((h: any) => {
        const dataStr = h.date.split('T')[0];
        if (!treinosPorData[dataStr]) treinosPorData[dataStr] = [];
        const setsDoTreino = (sets || []).filter((s: any) => s.workout_id === h.id);
        treinosPorData[dataStr].push(...setsDoTreino.map((s: any) => ({
          ...s,
          area: EXERCICIO_AREA[s.exercise_name] || 'Outros',
        })));
      });
      setTreinos(treinosPorData);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Gerar lista de datas disponíveis
  const datasDisponiveis = Object.keys(treinos);

  // Filtro de semana/dia
  let datasFiltradas: string[] = [];
  if (filtro === 'semana') {
    datasFiltradas = datasDisponiveis.filter(dateStr => {
      // Forçar UTC para o cálculo da semana
      const d = new Date(dateStr + 'T00:00:00Z');
      return getWeekNumber(d) === semana && d.getUTCFullYear() === ano;
    });
  } else if (filtro === 'dia' && dia) {
    datasFiltradas = [dia];
  }

  // Montar estrutura de áreas para exibição
  const areasComTreino = AREAS.map(area => {
    let exercicios: { nome: string; area: string; semana: number; ano: number; series: number; seriesExecutadas: number[] }[] = [];
    if (filtro === 'semana') {
      // Para o filtro de semana, agrupar por exercício na semana/ano
      const semanaAtual = semana;
      const anoAtual = ano;
      // Buscar todos os dias da semana selecionada
      datasDisponiveis.forEach(dateStr => {
        const { week, year } = getSemanaAno(dateStr);
        if (week === semanaAtual && year === anoAtual) {
          const exerciciosDaData = (treinos[dateStr] || []).filter((ex: any) => ex.area === area);
          exerciciosDaData.forEach((ex: any) => {
            if (!ex.exercise_name) return;
            // Agrupar por nome do exercício
            let existente = exercicios.find(e => e.nome === ex.exercise_name && e.semana === semanaAtual && e.ano === anoAtual);
            if (!existente) {
              console.log('datasFiltradas', datasFiltradas);
              // Buscar todos os sets desse exercício na semana (usando datasFiltradas)
              const setsDaSemana = datasFiltradas
                .map(dateStr => (treinos[dateStr] || []).filter((s: any) => s.exercise_name === ex.exercise_name && s.area === area))
                .flat();
              console.log('setsDaSemana', setsDaSemana);
              const seriesExecutadas = Array.from(new Set(setsDaSemana.map(s => s.series_number)))
                .filter(s => s !== undefined && s !== null)
                .sort((a, b) => a - b);
              exercicios.push({ nome: ex.exercise_name, area, semana: semanaAtual, ano: anoAtual, series: 0, seriesExecutadas });
              existente = exercicios[exercicios.length - 1];
            }
            if (ex.completed) existente.series += 1;
          });
        }
      });
    } else {
      // Filtro por dia (mantém como estava)
      datasFiltradas.forEach(dateStr => {
        const exerciciosDaData = (treinos[dateStr] || []).filter((ex: any) => ex.area === area);
        // Agrupar por exercício e contar séries
        const agrupados: Record<string, { nome: string; area: string; semana: number; ano: number; series: number; seriesExecutadas: number[] }> = {};
        exerciciosDaData.forEach((ex: any) => {
          if (!ex.exercise_name) return;
          if (!agrupados[ex.exercise_name]) {
            const { week, year } = getSemanaAno(dateStr);
            agrupados[ex.exercise_name] = { nome: ex.exercise_name, area, semana: week, ano: year, series: 0, seriesExecutadas: [] };
          }
          if (ex.completed) agrupados[ex.exercise_name].series += 1;
        });
        exercicios = exercicios.concat(Object.values(agrupados));
      });
    }
    return { area, exercicios };
  });

  // Gerar opções de semana (1 a 53)
  const semanasAno = Array.from({ length: 53 }, (_, i) => i + 1);

  const handleExerciseClick = useCallback(async (ex: { nome: string; area?: string; semana?: number; ano?: number; data?: string }) => {
    setSelectedExercise(ex);
    setMetricsLoading(true);
    setSelectedMetrics(null);
    setDebugHistory(null);
    setDebugSets(null);
    let history = [];
    if (filtro === 'semana') {
      function getStartAndEndOfWeek(week: number, year: number) {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4)
          ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
          ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        const start = new Date(ISOweekStart);
        const end = new Date(ISOweekStart);
        end.setDate(start.getDate() + 7);
        return { start, end };
      }
      const { start, end } = getStartAndEndOfWeek(ex.semana, ex.ano);
      const dataInicioSemana = start.toISOString().split('T')[0] + 'T00:00:00';
      const dataFimSemana = end.toISOString().split('T')[0] + 'T00:00:00';
      const { data: historyData } = await supabase
        .from('workout_history')
        .select('id, date')
        .gte('date', dataInicioSemana)
        .lt('date', dataFimSemana);
      history = historyData || [];
    } else if (ex.data) {
      const dataInicio = ex.data + 'T00:00:00';
      const dataFim = new Date(new Date(ex.data).getTime() + 24*60*60*1000).toISOString().split('T')[0] + 'T00:00:00';
      const { data: historyData } = await supabase
        .from('workout_history')
        .select('id, date')
        .gte('date', dataInicio)
        .lt('date', dataFim);
      history = historyData || [];
    }
    console.log('workout_history retornados:', history);
    setDebugHistory(history);
    if (!history || history.length === 0) {
      setSelectedMetrics([]);
      setMetricsLoading(false);
      setTimeout(scrollToTabela, 100);
      return;
    }
    let sets = [];
    if (filtro === 'semana') {
      const workoutIds = history.map((h: any) => h.id);
      const { data: setsData } = await supabase
        .from('workout_sets')
        .select('id, workout_id, exercise_name, series_number')
        .in('workout_id', workoutIds)
        .eq('exercise_name', ex.nome);
      sets = setsData || [];
    } else if (filtro === 'dia') {
      const workoutId = history[0].id;
      const { data: setsData } = await supabase
        .from('workout_sets')
        .select('id, workout_id, exercise_name, series_number')
        .eq('workout_id', workoutId)
        .eq('exercise_name', ex.nome);
      sets = setsData || [];
    }
    console.log('workout_sets retornados:', sets);
    setDebugSets(sets);
    if (!sets || sets.length === 0) {
      setSelectedMetrics([]);
      setMetricsLoading(false);
      setTimeout(scrollToTabela, 100);
      return;
    }
    const setIds = sets.map((s: any) => s.id);
    console.log('set_id usados:', setIds);
    let metrics: any[] = [];
    if (setIds.length > 0) {
      const { data: metricsData } = await supabase
        .from('workout_metrics')
        .select('*')
        .in('set_id', setIds);
      metrics = metricsData || [];
      const setIdToSet: Record<string, any> = {};
      sets.forEach((s: any) => { setIdToSet[s.id] = s; });
      metrics = metrics.map((m: any) => ({
        ...m,
        workout_id: setIdToSet[m.set_id]?.workout_id,
        series_number: setIdToSet[m.set_id]?.series_number ?? 1
      }));
    }
    console.log('métricas retornadas:', metrics);
    if (filtro === 'dia') {
      const setIdToSerie: Record<string, number> = {};
      sets.forEach((s: any) => { setIdToSerie[s.id] = s.series_number || 1; });
      metrics = metrics
        .map(m => ({ ...m, series_number: setIdToSerie[m.set_id] || 1 }))
        .sort((a, b) => {
          const serieA = a.series_number || 1;
          const serieB = b.series_number || 1;
          if (serieA !== serieB) return serieA - serieB;
          const repA = a.repetition_number || 1;
          const repB = b.repetition_number || 1;
          return repA - repB;
        });
    }
    setSelectedMetrics(metrics);
    setMetricsLoading(false);
    setTimeout(scrollToTabela, 100);
  }, [filtro, datasDisponiveis]);

  // Função para formatar valores no tooltip do gráfico
  function formatGraficoValor(value: any, name: any) {
    return value !== null && value !== undefined ? Number(value).toFixed(2) : '-';
  }

  // Montar chartData para o gráfico
  let chartData: any[] = [];
  if (selectedMetrics && selectedMetrics.length > 0) {
    if (filtro === 'semana') {
      // Buscar todos os sets do exercício na semana
      const setsDaSemana = datasFiltradas
        .map(dateStr => (treinos[dateStr] || []).filter((s: any) => s.exercise_name === selectedExercise?.nome))
        .flat();
      // Descobrir todas as séries executadas
      const seriesUnicas = Array.from(new Set(setsDaSemana.map(s => s.series_number)))
        .filter(s => s !== undefined && s !== null)
        .sort((a, b) => a - b);
      // Descobrir o maior número de repetições em qualquer série
      const maxRep = Math.max(...setsDaSemana.map(s => s.repetitions || 1), 1);
      // Montar matriz de colunas: para cada série e rep, buscar métrica correspondente
      const matriz: any[] = [];
      seriesUnicas.forEach(serie => {
        // Descobrir o maior repetition_number das métricas dessa série
        const repsMetrica = selectedMetrics
          .filter(m => m.series_number === serie)
          .map(m => m.repetition_number || 1);
        const maxRep = repsMetrica.length > 0 ? Math.max(...repsMetrica) : 1;
        for (let rep = 1; rep <= maxRep; rep++) {
          const metrica = selectedMetrics.find(m => m.series_number === serie && m.repetition_number === rep);
          matriz.push({ serie, rep, metrica });
        }
      });
      chartData = matriz.map((cell, i) => {
        const extra = cell.metrica?.extra_data || {};
        return {
          label: `S${cell.serie}-R${cell.rep}`,
          minAngle: extra.minAngle !== undefined ? Number(extra.minAngle) : null,
          maxAngle: extra.maxAngle !== undefined ? Number(extra.maxAngle) : null,
          executionTime: extra.executionTime !== undefined ? Number(extra.executionTime) : null,
          amplitude: extra.amplitude !== undefined ? Number(extra.amplitude) : null,
          upVelocity: extra.upVelocity !== undefined ? Number(extra.upVelocity) : null,
          downVelocity: extra.downVelocity !== undefined ? Number(extra.downVelocity) : null,
        };
      });
    } else if (filtro === 'dia') {
      // Ordenar por série e repetição
      const metricsOrdenadas = [...selectedMetrics].filter((m: any) => (m.series_number || 1) === serieSelecionada)
        .sort((a, b) => {
          const repA = a.repetition_number || 1;
          const repB = b.repetition_number || 1;
          return repA - repB;
        });
      chartData = metricsOrdenadas.map((m: any, i: number) => {
        const extra = m.extra_data || {};
        return {
          label: `S${m.series_number || 1}-R${m.repetition_number || i + 1}`,
          minAngle: extra.minAngle !== undefined ? Number(extra.minAngle) : null,
          maxAngle: extra.maxAngle !== undefined ? Number(extra.maxAngle) : null,
          executionTime: extra.executionTime !== undefined ? Number(extra.executionTime) : null,
          amplitude: extra.amplitude !== undefined ? Number(extra.amplitude) : null,
          upVelocity: extra.upVelocity !== undefined ? Number(extra.upVelocity) : null,
          downVelocity: extra.downVelocity !== undefined ? Number(extra.downVelocity) : null,
        };
      });
    }
  }

  // Adicionar log para depuração fora do JSX
  useEffect(() => {
    if (selectedExercise) {
      console.log('selectedMetrics para renderização:', selectedMetrics);
    }
  }, [selectedExercise, selectedMetrics]);

  // Montar metricsOrdenadas para o filtro de dia
  let metricsOrdenadas: any[] = [];
  if (filtro === 'dia' && selectedMetrics && selectedMetrics.length > 0) {
    metricsOrdenadas = [...selectedMetrics]
      .filter((m: any) => (m.series_number || 1) === serieSelecionada)
      .sort((a, b) => {
        const repA = a.repetition_number || 1;
        const repB = b.repetition_number || 1;
        return repA - repB;
      });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="flex flex-col md:flex-row w-full max-w-6xl gap-6">
          {/* Menu lateral de áreas/exercícios */}
          <div className="bg-white rounded-lg shadow-md p-6 w-full md:w-1/2 max-w-md">
            <div className="mb-4 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-center flex-1">Minhas métricas</h1>
            </div>
            {/* Filtros */}
            <div className="flex gap-4 mb-6 justify-center">
              <Button variant={filtro === 'semana' ? 'default' : 'outline'} onClick={() => setFiltro('semana')}>Semana/Ano</Button>
              <Button variant={filtro === 'dia' ? 'default' : 'outline'} onClick={() => setFiltro('dia')}>Dia</Button>
            </div>
            {filtro === 'semana' ? (
              <div className="flex gap-4 mb-6 justify-center">
                <select value={semana} onChange={e => setSemana(Number(e.target.value))} className="border rounded px-2 py-1">
                  {semanasAno.map(s => <option key={s} value={s}>Semana {s}</option>)}
                </select>
                <select value={ano} onChange={e => setAno(Number(e.target.value))} className="border rounded px-2 py-1">
                  {[ano-1, ano, ano+1].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex gap-4 mb-6 justify-center">
                <select value={dia} onChange={e => setDia(e.target.value)} className="border rounded px-2 py-1">
                  <option value="">Selecione o dia</option>
                  {datasDisponiveis.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            {/* Lista de áreas e exercícios */}
            {loading ? <div className="text-center">Carregando...</div> : (
              <div className="space-y-2">
                {areasComTreino.map(({ area, exercicios }) => (
                  <div key={area} className="bg-gray-100 rounded p-3">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setAreaExpandida(areaExpandida === area ? null : area)}>
                      <span className="font-semibold">{area}</span>
                      {areaExpandida === area ? <ChevronDown /> : <ChevronRight />}
                    </div>
                    {areaExpandida === area && (
                      <ul className="mt-2 space-y-1">
                        {exercicios.length === 0 && <li className="text-gray-400 text-sm">Nenhum exercício registrado</li>}
                        {exercicios.map((ex, idx) => (
                          filtro === 'semana' ? (
                            <li key={ex.nome + ex.semana + ex.ano} className={`flex items-start gap-4 px-2 py-1 rounded cursor-pointer`}
                              onClick={() => handleExerciseClick(ex)}
                            >
                              <div className="flex-1">
                                <span className="block text-left">
                                  <span className="font-semibold">{ex.area}</span> - {ex.nome} (Semana {ex.semana}/{ex.ano})
                                  {ex.seriesExecutadas && ex.seriesExecutadas.length > 0 && (
                                    <ul className="ml-4 mt-1 text-xs text-gray-600 list-disc">
                                      {ex.seriesExecutadas.map(serie => (
                                        <li key={serie}>Série {serie}</li>
                                      ))}
                                    </ul>
                                  )}
                                </span>
                              </div>
                            </li>
                          ) : (
                            <li key={ex.nome + ex.semana + ex.ano} className={`flex items-start gap-4 px-2 py-1 rounded cursor-pointer`}
                              onClick={() => handleExerciseClick({ nome: ex.nome, data: datasFiltradas[0] })}
                            >
                              <div className="flex-1">
                                <span className="block text-left">{ex.nome}{datasFiltradas[0] ? ` (${(() => { const d = new Date(datasFiltradas[0] + 'T00:00:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); })()})` : ''}</span>
                              </div>
                            </li>
                          )
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Painel de métricas à direita */}
          {selectedExercise && (
            <div ref={tabelaRef} className="bg-white rounded-lg shadow-md p-6 w-full md:w-1/2 max-w-2xl flex flex-col">
              <div className="mb-2 font-bold text-lg text-center text-formfit-blue">
                {selectedExercise.nome} {filtro === 'semana' && selectedExercise.semana && selectedExercise.ano ? `(Semana ${selectedExercise.semana}/${selectedExercise.ano})` : ''}
                {filtro === 'dia' && selectedExercise.data ? ` (${(() => { const d = new Date(selectedExercise.data + 'T00:00:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); })()})` : ''}
              </div>
              {metricsLoading ? (
                <div className="text-center text-sm text-gray-500">Carregando métricas...</div>
              ) : filtro === 'dia' ? (
                <>
                  <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                    {(() => {
                      if (!metricsOrdenadas || metricsOrdenadas.length === 0) {
                        return (
                          <table className="text-xs w-full min-w-max">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="py-1 px-2 text-left">Indicador</th>
                                <th className="py-1 px-2 text-left">Repetição 1</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td colSpan={10}>Nenhuma métrica encontrada.</td>
                              </tr>
                            </tbody>
                          </table>
                        );
                      }
                      // Gerar lista de repetições únicas (em ordem de aparição)
                      const repsUnicas = Array.from(new Set(metricsOrdenadas.map(m => m.repetition_number || 1)));
                      // Mapear: para cada repetição, pegar a métrica correspondente
                      const metricaPorRep: Record<number, any> = {};
                      repsUnicas.forEach(rep => {
                        metricaPorRep[rep] = metricsOrdenadas.find(m => (m.repetition_number || 1) === rep);
                      });
                      // Lista de indicadores
                      const indicadores = [
                        { key: 'minAngle', label: 'Ângulo Mínimo', sufixo: 'º', casas: 1 },
                        { key: 'maxAngle', label: 'Ângulo Máximo', sufixo: 'º', casas: 1 },
                        { key: 'executionTime', label: 'Tempo Execução', sufixo: '', casas: 2 },
                        { key: 'amplitude', label: 'Amplitude', sufixo: 'º', casas: 1 },
                        { key: 'upVelocity', label: 'Vel. Subida', sufixo: 'º/s', casas: 2 },
                        { key: 'downVelocity', label: 'Vel. Descida', sufixo: 'º/s', casas: 2 },
                      ];
                      return (
                        <table className="text-xs w-full min-w-max">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-1 px-2 text-left">Indicador</th>
                              {repsUnicas.map((rep, idx) => (
                                <th key={idx} className="py-1 px-2 text-center">Repetição {rep}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {indicadores.map((ind, i) => (
                              <tr key={i}>
                                <td className="py-1 px-2 font-semibold">{ind.label}</td>
                                {repsUnicas.map((rep, j) => {
                                  const metrica = metricaPorRep[rep];
                                  const extra = metrica?.extra_data || {};
                                  let valor = '-';
                                  if (metrica && extra[ind.key] !== undefined && extra[ind.key] !== null) {
                                    valor = typeof extra[ind.key] === 'number' ? Number(extra[ind.key]).toFixed(ind.casas) : extra[ind.key];
                                    if (ind.sufixo) valor += ind.sufixo;
                                  }
                                  return <td key={j} className="py-1 px-2 text-center">{valor}</td>;
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </>
              ) : filtro === 'semana' ? (
                <>
                  <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                    {(() => {
                      const metrics = removeDuplicateMetrics(selectedMetrics);
                      if (!metrics || metrics.length === 0) {
                        return (
                          <table className="text-xs w-full min-w-max">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="py-1 px-2 text-left">Indicador</th>
                                <th className="py-1 px-2 text-left">Repetição 1</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td colSpan={10}>Nenhuma métrica encontrada.</td>
                              </tr>
                            </tbody>
                          </table>
                        );
                      }
                      // Ordenar métricas por série e repetição
                      const metricsOrdenadas = [...metrics].sort((a, b) => {
                        const serieA = a.series_number || 1;
                        const serieB = b.series_number || 1;
                        if (serieA !== serieB) return serieA - serieB;
                        const repA = a.repetition_number || 1;
                        const repB = b.repetition_number || 1;
                        return repA - repB;
                      });
                      // Gerar lista de repetições únicas (em ordem de aparição)
                      const repsUnicas = Array.from(new Set(metricsOrdenadas.map(m => m.repetition_number || 1)));
                      // Mapear: para cada repetição, pegar a primeira métrica encontrada (pode ser de qualquer série)
                      const metricaPorRep: Record<number, any> = {};
                      repsUnicas.forEach(rep => {
                        metricaPorRep[rep] = metricsOrdenadas.find(m => (m.repetition_number || 1) === rep);
                      });
                      // Lista de indicadores
                      const indicadores = [
                        { key: 'minAngle', label: 'Ângulo Mínimo', sufixo: 'º', casas: 1 },
                        { key: 'maxAngle', label: 'Ângulo Máximo', sufixo: 'º', casas: 1 },
                        { key: 'executionTime', label: 'Tempo Execução', sufixo: '', casas: 2 },
                        { key: 'amplitude', label: 'Amplitude', sufixo: 'º', casas: 1 },
                        { key: 'upVelocity', label: 'Vel. Subida', sufixo: 'º/s', casas: 2 },
                        { key: 'downVelocity', label: 'Vel. Descida', sufixo: 'º/s', casas: 2 },
                      ];
                      return (
                        <table className="text-xs w-full min-w-max">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-1 px-2 text-left">Indicador</th>
                              {repsUnicas.map((rep, idx) => (
                                <th key={idx} className="py-1 px-2 text-center">Repetição {rep}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {indicadores.map((ind, i) => (
                              <tr key={i}>
                                <td className="py-1 px-2 font-semibold">{ind.label}</td>
                                {repsUnicas.map((rep, j) => {
                                  const metrica = metricaPorRep[rep];
                                  const extra = metrica?.extra_data || {};
                                  let valor = '-';
                                  if (metrica && extra[ind.key] !== undefined && extra[ind.key] !== null) {
                                    valor = typeof extra[ind.key] === 'number' ? Number(extra[ind.key]).toFixed(ind.casas) : extra[ind.key];
                                    if (ind.sufixo) valor += ind.sufixo;
                                  }
                                  return <td key={j} className="py-1 px-2 text-center">{valor}</td>;
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </>
              ) : null}
              {/* Gráfico de linha */}
              <div className="mt-6">
                <div className="mb-2 flex items-center gap-2">
                  <label htmlFor="indicador-grafico" className="font-medium text-sm">Indicador:</label>
                  <select
                    id="indicador-grafico"
                    className="border rounded px-2 py-1 text-sm"
                    value={graficoIndicador}
                    onChange={e => setGraficoIndicador(e.target.value)}
                  >
                    <option value="minAngle">Ângulo Mínimo</option>
                    <option value="maxAngle">Ângulo Máximo</option>
                    <option value="executionTime">Tempo Execução</option>
                    <option value="amplitude">Amplitude</option>
                    <option value="upVelocity">Vel. Subida</option>
                    <option value="downVelocity">Vel. Descida</option>
                  </select>
                </div>
                {/* Gráfico de linha */}
                {(filtro === 'dia'
                  ? metricsOrdenadas.length > 0
                  : removeDuplicateMetrics(selectedMetrics).length > 0
                ) && (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={(filtro === 'dia'
                        ? metricsOrdenadas
                        : removeDuplicateMetrics(selectedMetrics)
                      ).map((m: any, i: number) => {
                        const extra = m.extra_data || {};
                        return {
                          label: `S${m.series_number || 1}-R${m.repetition_number || i + 1}`,
                          minAngle: extra.minAngle !== undefined ? Number(extra.minAngle) : null,
                          maxAngle: extra.maxAngle !== undefined ? Number(extra.maxAngle) : null,
                          executionTime: extra.executionTime !== undefined ? Number(extra.executionTime) : null,
                          amplitude: extra.amplitude !== undefined ? Number(extra.amplitude) : null,
                          upVelocity: extra.upVelocity !== undefined ? Number(extra.upVelocity) : null,
                          downVelocity: extra.downVelocity !== undefined ? Number(extra.downVelocity) : null,
                        };
                      })} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <XAxis dataKey="label" />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip formatter={(value: any) => value !== null && value !== undefined ? Number(value).toFixed(2) : '-'} />
                        <Line type="monotone" dataKey={graficoIndicador} stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Gráfico de pizza de execuções boas */}
                {selectedExercise && ((filtro === 'dia' ? metricsOrdenadas.length : removeDuplicateMetrics(selectedMetrics).length) > 0) && (
                  (() => {
                    // Buscar modelo selecionado (padrão: Iniciante)
                    const modelo = modalModelo || 'Iniciante';
                    const parametros = getParametrosTreino(modelo, selectedExercise.nome);
                    const indicadorKeyMap: Record<string, string> = {
                      minAngle: 'anguloMin',
                      maxAngle: 'anguloMax',
                      executionTime: 'tempoExecucao',
                      amplitude: 'amplitude',
                      upVelocity: 'velocidadeSubida',
                      downVelocity: 'velocidadeDescida',
                    };
                    const parametro = parametros ? parametros[indicadorKeyMap[graficoIndicador]] : null;
                    const metricsParaCalculo = filtro === 'dia' ? metricsOrdenadas : removeDuplicateMetrics(selectedMetrics);
                    const { boas, total } = calcularExecucoesBoas(metricsParaCalculo, graficoIndicador, parametro);
                    const dataPie = [
                      { name: 'Boa Execução', value: boas },
                      { name: 'Fora do Ideal', value: total - boas },
                    ];
                    const COLORS = ['#22c55e', '#ef4444'];
                    return (
                      <div className="flex flex-col items-center mt-8">
                        <h3 className="font-semibold mb-2 text-sm">Proporção de execuções boas ({indicadorLabel(graficoIndicador)})</h3>
                        <PieChart width={220} height={220}>
                          <Pie
                            data={dataPie}
                            cx={110}
                            cy={110}
                            innerRadius={50}
                            outerRadius={90}
                            fill="#8884d8"
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {dataPie.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                        <div className="text-xs text-gray-500 mt-2">Considera execuções dentro de ±5% do parâmetro como boas</div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
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
                const exercicioObj = TODOS_EXERCICIOS.find(e => e.name === modalExecucao.exercicio.nome || e.id === modalExecucao.exercicio.id) || { id: modalExecucao.exercicio.id, name: modalExecucao.exercicio.nome };
                localStorage.setItem("currentExercise", JSON.stringify({
                  id: exercicioObj.id,
                  name: exercicioObj.name,
                  modelo: modalModelo,
                  carga: modalSemCarga ? null : modalCarga,
                  area: modalExecucao.exercicio.area || '',
                  semana: modalExecucao.exercicio.semana,
                  ano: modalExecucao.exercicio.ano,
                  data: modalExecucao.exercicio.data
                }));
                setModalExecucao(null);
                navigate('/workout-flow/execution');
              }}>Iniciar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeusTreinos; 