import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFitHeader from '@/components/FormFitHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const Perfil: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        toast({ title: 'Faça login para acessar o perfil', variant: 'destructive' });
        navigate('/login');
        return;
      }
      setUser(user);
      // Buscar perfil
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData || {});
      setLoading(false);
    };
    fetchProfile();
  }, [navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Atualizar perfil
    const { error } = await supabase.from('user_profiles').upsert({
      id: user.id,
      full_name: profile.full_name,
      age: Number(profile.age),
      weight: profile.weight ? Number(profile.weight) : null,
      height: profile.height ? Number(profile.height) : null,
      phone: profile.phone || null,
      email: profile.email || user.email,
    });
    if (error) {
      toast({ title: 'Erro ao salvar perfil', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }
    // Atualizar senha se preenchida
    if (senha) {
      const { error: passError } = await supabase.auth.updateUser({ password: senha });
      if (passError) {
        toast({ title: 'Erro ao atualizar senha', description: passError.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
    }
    toast({ title: 'Perfil atualizado com sucesso!' });
    setSaving(false);
    setSenha('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormFitHeader />
      <main className="flex-grow flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="formfit-heading text-center flex-1">Meu Perfil</h1>
          </div>
          <form className="bg-white rounded-lg shadow-md p-8 w-full space-y-6" onSubmit={handleSave}>
            <div className="space-y-2">
              <label className="block font-medium">Nome</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="text"
                name="full_name"
                value={profile.full_name || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Idade</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="number"
                name="age"
                min={10}
                max={120}
                value={profile.age || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Peso (kg)</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="number"
                name="weight"
                min={20}
                max={300}
                value={profile.weight || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Altura (cm)</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="number"
                name="height"
                min={100}
                max={250}
                value={profile.height || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Telefone</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="tel"
                name="phone"
                value={profile.phone || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="block font-medium">E-mail</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="email"
                name="email"
                value={profile.email || user.email || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Nova Senha</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="password"
                name="senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Deixe em branco para não alterar"
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Perfil; 