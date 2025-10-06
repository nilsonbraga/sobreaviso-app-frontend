import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, Calendar } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const [searchParams] = useSearchParams();

  const user    = useAuth(s => s.user);
  const doLogin = useAuth(s => s.login);
  const hydrate = useAuth(s => s.hydrate);

  // Se já está logado, manda pro painel
  useEffect(() => { hydrate?.(); }, []);
  useEffect(() => {
    if (user) {
      const fromState  = location.state?.from?.pathname;
      const fromQuery  = searchParams.get('redirect');
      const fallback   = '/admin/on-duty';
      navigate(fromState || fromQuery || fallback, { replace: true });
    }
  }, [user, location.state, searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Espera-se { token, refreshToken?, user: { id, name, email, role, teamId } }
      const session = await api.post('/auth/login', { email, password });
      doLogin(session);

      toast({
        title: 'Login realizado!',
        description: `Bem-vindo, ${session.user.name}!`,
      });
      // redireciona no useEffect acima
    } catch (err) {
      toast({
        title: 'Erro no login',
        description: err?.message || 'Email ou senha incorretos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-600 via-blue-600 to-sky-400 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >       

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Área Administrativa</h2>
          <p className="text-gray-600">Faça login para gerenciar as escalas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full h-12 text-lg" size="lg" disabled={loading}>
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong>Acesso</strong><br />
            Para ter acesso ao sistema de escala de sobreaviso entre em contato com o SETISD.<br />
          </p>
        </div>

         <div className="flex justify-center">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-slate-600 hover:text-slate-900">
            <Link to="/" title="Ver plantonistas">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Ver Plantonistas
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
