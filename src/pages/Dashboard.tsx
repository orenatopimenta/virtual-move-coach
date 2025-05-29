import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Calendar, Dumbbell, ClipboardCheck, Award, User, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { MOCK_TREINOS } from '../mocks/mockTreinos';
import { MODELOS } from './TreinoIA';

// Adicionar componente de modal para treino personalizado
const diasSemana = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

// Exercícios padrão por área (copiado de ExerciciosPorArea)
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

function TreinoPersonalizadoModal({ open, onClose, sets, history }: { open: boolean, onClose: () => void, sets: any[], history: any[] }) {
  const [treinoSelecionado, setTreinoSelecionado] = useState('');
  const navigate = useNavigate();
  // Buscar treinos do localStorage
  const treinosSalvos = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('treinosPersonalizados') || '[]') : [];
  // Filtrar treino pelo nome selecionado
  const treino = treinosSalvos.find((t: any) => t.nome === treinoSelecionado);
  // Agrupar por área
  const areas: Record<string, string[]> = {};
  if (treino && Array.isArray(treino.treinos)) {
    treino.treinos.forEach((t: any) => {
      if (!areas[t.area]) areas[t.area] = [];
      areas[t.area].push(t.area);
    });
  }
  // Montar lista de exercícios por área
  const listaExercicios = Object.keys(areas).reduce((acc, area) => {
    acc[area] = (treino?.treinos.find((t: any) => t.area === area)?.exercicios || []).map((exId: string) => {
      const ex = (EXERCICIOS_POR_AREA[area] || []).find(e => e.id === exId);
      return ex ? { ...ex } : { id: exId, name: exId };
    });
    return acc;
  }, {} as Record<string, { id: string, name: string }[]>);
  const temExercicios = Object.values(listaExercicios).some(arr => arr.length > 0);

  // Buscar execuções reais do Supabase para o treino selecionado (usando dia, se quiser manter)
  let execucoesPorExercicio: Record<string, number> = {};
  if (treinoSelecionado && treino && treino.dia) {
    const dataStr = history.find((h: any) => h.date && h.date.split('T')[0] === treino.dia);
    if (dataStr) {
      const workoutId = dataStr.id;
      sets.filter((s: any) => s.workout_id === workoutId).forEach((s: any) => {
        if (!s.exercise_name) return;
        if (!execucoesPorExercicio[s.exercise_name]) execucoesPorExercicio[s.exercise_name] = 0;
        if (s.completed) execucoesPorExercicio[s.exercise_name] += 1;
      });
    }
  }
  const TOTAL_SERIES_PADRAO = 3;

  return open ? (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-4 text-center">Iniciar Treino Personalizado</h2>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Selecione o treino:</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={treinoSelecionado}
            onChange={e => setTreinoSelecionado(e.target.value)}
          >
            <option value="">Selecione...</option>
            {treinosSalvos.map((t: any) => (
              <option key={t.nome} value={t.nome}>{t.nome}</option>
            ))}
          </select>
        </div>
        {treinoSelecionado && (
          <div>
            {Object.keys(listaExercicios).length === 0 && <div className="text-gray-500 text-center">Nenhum exercício salvo para este treino.</div>}
            {Object.keys(listaExercicios).map(area => (
              <div key={area} className="mb-2">
                <div className="font-semibold mb-1">{area}</div>
                <ul className="list-disc ml-6">
                  {listaExercicios[area].map(ex => {
                    const seriesExecutadas = execucoesPorExercicio[ex.name] || 0;
                    const completed = seriesExecutadas >= TOTAL_SERIES_PADRAO;
                    return (
                      <li key={ex.id} className={`flex justify-between items-center px-2 py-1 rounded ${completed ? 'bg-green-100 text-green-700 font-semibold' : ''}`}>
                        <span>{ex.name}</span>
                        <span className={`ml-2 ${completed ? 'text-green-700 font-bold' : 'text-gray-600'}`}>{seriesExecutadas}/{TOTAL_SERIES_PADRAO}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {temExercicios && (
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => navigate(`/treino-personalizado-execucao?treino=${encodeURIComponent(treino?.nome || '')}`)}>
                Iniciar treino
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  ) : null;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = React.useState<any>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [sets, setSets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newTitle, setNewTitle] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [showTreinoPersonalizado, setShowTreinoPersonalizado] = useState(false);
  // Filtro de período
  const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensal' | 'anual'>('semanal');
  const [modalExecucao, setModalExecucao] = useState(false);
  const [modalModelo, setModalModelo] = useState(MODELOS[0]);
  const [modalCarga, setModalCarga] = useState(0);
  const [modalSemCarga, setModalSemCarga] = useState(true);

  // Função para filtrar history conforme o período
  const filtrarHistory = () => {
    const now = new Date();
    return history.filter((h: any) => {
      if (!h.date) return false;
      const data = new Date(h.date);
      if (periodo === 'diario') {
        return data.toDateString() === now.toDateString();
      }
      if (periodo === 'semanal') {
        // Semana ISO (segunda a domingo)
        const getWeek = (d: Date) => {
          const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
          const dayNum = date.getUTCDay() || 7;
          date.setUTCDate(date.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
          return Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1)/7);
        };
        return (
          data.getUTCFullYear() === now.getUTCFullYear() &&
          getWeek(data) === getWeek(now)
        );
      }
      if (periodo === 'mensal') {
        return data.getUTCFullYear() === now.getUTCFullYear() && data.getUTCMonth() === now.getUTCMonth();
      }
      if (periodo === 'anual') {
        return data.getUTCFullYear() === now.getUTCFullYear();
      }
      return true;
    });
  };

  // Função para filtrar sets conforme o history filtrado
  const historyFiltrado = filtrarHistory();
  const setsFiltrados = sets.filter((s: any) => historyFiltrado.some((h: any) => h.id === s.workout_id));

  React.useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        toast({
          title: "Acesso restrito",
          description: "Faça login para acessar o dashboard",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }
      // Buscar perfil
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);
      // Buscar histórico de treinos
      const { data: historyData } = await supabase
        .from('workout_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      setHistory(historyData || []);
      // Buscar séries
      const { data: setsData } = await supabase
        .from('workout_sets')
        .select('*')
        .in('workout_id', (historyData || []).map((h: any) => h.id));
      setSets(setsData || []);
      setLoading(false);
    };
    getData();
    // eslint-disable-next-line
  }, [navigate, toast]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Obrigado por usar o AI Trainer",
    });
    navigate('/');
  };

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      toast({ title: 'Título obrigatório', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' });
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      title: newTitle,
      description: newDescription
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar treino', description: error.message, variant: 'destructive' });
      return;
    }
    setNewTitle('');
    setNewDescription('');
    toast({ title: 'Treino cadastrado com sucesso!' });
    // Atualiza lista
    const { data: workoutsData } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setHistory(workoutsData || []);
  };

  // Mapeamento simples de exercícios para áreas
  const AREAS = ['Pernas','Braços','Ombros','Peito','Costas','Abdômen'];
  const EXERCICIO_AREA: Record<string, string> = {
    'Agachamento': 'Pernas',
    'Leg Press': 'Pernas',
    'Rosca Bíceps': 'Braços',
    'Tríceps': 'Braços',
    // Adicione mais mapeamentos conforme necessário
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow">
        <div className="formfit-container py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="formfit-heading">Dashboard</h1>
            <div className="flex gap-4">
              <Button 
                variant="outline"
                onClick={handleLogout}
              >
                Sair
              </Button>
              <Link to="/parametros-treino">
                <Button variant="ghost" size="icon" aria-label="Parâmetros de treino">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Filtros de período */}
          <div className="flex justify-center gap-2 mb-6">
            <Button variant={periodo === 'diario' ? 'default' : 'outline'} onClick={() => setPeriodo('diario')}>Diário</Button>
            <Button variant={periodo === 'semanal' ? 'default' : 'outline'} onClick={() => setPeriodo('semanal')}>Semanal</Button>
            <Button variant={periodo === 'mensal' ? 'default' : 'outline'} onClick={() => setPeriodo('mensal')}>Mensal</Button>
            <Button variant={periodo === 'anual' ? 'default' : 'outline'} onClick={() => setPeriodo('anual')}>Anual</Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <Card className="p-0 h-24 flex items-center justify-center">
              <CardHeader className="pb-1 px-2 pt-2">
                <CardTitle className="text-xs font-medium text-gray-500">Treinos Realizados</CardTitle>
              </CardHeader>
              <CardContent className="py-1 px-2 flex items-center justify-center">
                <Activity className="h-4 w-4 text-formfit-blue mr-1" />
                <span className="text-lg font-bold">{historyFiltrado.length}</span>
              </CardContent>
            </Card>
            <Card className="p-0 h-24 flex items-center justify-center">
              <CardHeader className="pb-1 px-2 pt-2">
                <CardTitle className="text-xs font-medium text-gray-500">Séries Completadas</CardTitle>
              </CardHeader>
              <CardContent className="py-1 px-2 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-lg font-bold">{setsFiltrados.length}</span>
              </CardContent>
            </Card>
            <Card className="p-0 h-24 flex items-center justify-center">
              <CardHeader className="pb-1 px-2 pt-2">
                <CardTitle className="text-xs font-medium text-gray-500">Minutos Ativos</CardTitle>
              </CardHeader>
              <CardContent className="py-1 px-2 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-500 mr-1" />
                <span className="text-lg font-bold">{historyFiltrado.reduce((acc, h) => acc + (h.total_time || 0), 0)}</span>
              </CardContent>
            </Card>
            <Card className="p-0 h-24 flex items-center justify-center">
              <CardHeader className="pb-1 px-2 pt-2">
                <CardTitle className="text-xs font-medium text-gray-500">Pontos XP</CardTitle>
              </CardHeader>
              <CardContent className="py-1 px-2 flex items-center justify-center">
                <Award className="h-4 w-4 text-purple-600 mr-1" />
                <span className="text-lg font-bold">{historyFiltrado.reduce((acc, h) => acc + (h.xp || 0), 0)}</span>
              </CardContent>
            </Card>
          </div>
          
          {/* Progresso semanal */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Progresso Semanal</CardTitle>
              <CardDescription>Veja seu progresso por área muscular nesta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  // Agrupar sets por data
                  const getWeekNumber = (date: Date) => {
                    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                    const dayNum = d.getUTCDay() || 7;
                    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
                    return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1)/7);
                  };
                  const now = new Date();
                  const semanaAtual = getWeekNumber(now);
                  const anoAtual = now.getFullYear();
                  // Agrupar sets por área e exercício na semana atual
                  const seriesPorArea: Record<string, { total: number, exercicios: Record<string, number> }> = {};
                  historyFiltrado.forEach((h: any) => {
                    const d = new Date(h.date);
                    if (getWeekNumber(d) === semanaAtual && d.getFullYear() === anoAtual) {
                      const setsDoTreino = sets.filter((s: any) => s.workout_id === h.id);
                      setsDoTreino.forEach((s: any) => {
                        const area = EXERCICIO_AREA[s.exercise_name] || 'Outros';
                        if (!seriesPorArea[area]) seriesPorArea[area] = { total: 0, exercicios: {} };
                        if (!seriesPorArea[area].exercicios[s.exercise_name]) seriesPorArea[area].exercicios[s.exercise_name] = 0;
                        if (s.completed) seriesPorArea[area].exercicios[s.exercise_name] += 1;
                      });
                    }
                  });
                  // Calcular progresso de cada área: média dos percentuais dos exercícios
                  return AREAS.map(area => {
                    const info = seriesPorArea[area];
                    if (!info) {
                      return (
                        <div className="space-y-1" key={area}>
                          <div className="flex justify-between text-sm">
                            <span>{area}</span>
                            <span className="font-medium">0%</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      );
                    }
                    const exercicios = Object.values(EXERCICIOS_POR_AREA[area] || {}).map(e => e.name);
                    const percentuais = exercicios.map(nome => {
                      const series = info.exercicios[nome] || 0;
                      return Math.min(100, Math.round((series / 3) * 100));
                    });
                    const media = percentuais.length > 0 ? Math.round(percentuais.reduce((a, b) => a + b, 0) / percentuais.length) : 0;
                    return (
                      <div className="space-y-1" key={area}>
                        <div className="flex justify-between text-sm">
                          <span>{area}</span>
                          <span className="font-medium">{media}%</span>
                        </div>
                        <Progress value={media} className="h-2" />
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
          
          {/* Botões de ação */}
          <div className="text-center mb-8">
            <div className="w-full flex justify-center gap-4 mb-4">
              <Link to="/treinos">
                <Button className="bg-formfit-blue hover:bg-formfit-blue/90 text-white font-medium px-8 py-6 rounded-lg text-lg flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Iniciar treino livre
                </Button>
              </Link>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-6 rounded-lg text-lg flex items-center gap-2" onClick={() => navigate('/treino-personalizado')}>
                Treino Personalizado
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-6 rounded-lg text-lg flex items-center gap-2" onClick={() => navigate('/treino-ia')}>
                Treino com IA
              </Button>
            </div>
            <div className="w-full flex justify-center gap-4">
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-8 py-6 rounded-lg text-lg flex items-center gap-2" onClick={() => setShowTreinoPersonalizado(true)}>
                Iniciar treino personalizado
              </Button>
              <Link to="/meus-treinos">
                <Button className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-6 rounded-lg text-lg flex items-center gap-2">
                  Minhas métricas
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Últimas atividades */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Agrupar por data */}
                {(() => {
                  // Agrupar sets por data
                  const treinosPorData: Record<string, any[]> = {};
                  historyFiltrado.forEach((h: any) => {
                    const dataStr = h.date.split('T')[0];
                    if (!treinosPorData[dataStr]) treinosPorData[dataStr] = [];
                    const setsDoTreino = sets.filter((s: any) => s.workout_id === h.id);
                    treinosPorData[dataStr].push(...setsDoTreino.map((s: any) => ({
                      ...s,
                      area: EXERCICIO_AREA[s.exercise_name] || 'Outros',
                    })));
                  });
                  const datas = Object.keys(treinosPorData).sort((a, b) => b.localeCompare(a));
                  return datas.map((dateStr, idx) => (
                    <div key={idx} className="border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Dumbbell className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="font-medium">{dateStr}</p>
                      </div>
                      <ul className="ml-10">
                        {/* Agrupar por área */}
                        {['Pernas','Braços','Ombros','Peito','Costas','Abdômen','Outros'].map(area => {
                          const exerciciosDaArea = treinosPorData[dateStr].filter(ex => ex.area === area);
                          if (exerciciosDaArea.length === 0) return null;
                          // Agrupar por exercício
                          const agrupados: Record<string, number> = {};
                          exerciciosDaArea.forEach((ex: any) => {
                            if (!ex.exercise_name) return;
                            if (!agrupados[ex.exercise_name]) agrupados[ex.exercise_name] = 0;
                            if (ex.completed) agrupados[ex.exercise_name] += 1;
                          });
                          return (
                            <li key={area} className="mb-1">
                              <span className="font-semibold">{area}:</span>
                              <ul className="ml-4">
                                {Object.entries(agrupados).map(([nome, series]) => (
                                  <li key={nome} className={series > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'}>
                                    {nome} {series > 0 && (<span>({series} série{series > 1 ? 's' : ''})</span>)}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <TreinoPersonalizadoModal open={showTreinoPersonalizado} onClose={() => setShowTreinoPersonalizado(false)} sets={sets} history={history} />
    </div>
  );
};

export default Dashboard;
