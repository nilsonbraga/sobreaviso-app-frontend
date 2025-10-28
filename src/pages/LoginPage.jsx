// src/pages/Login.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, Calendar } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';              
import authApi from '@/services/authApi';     
import useAuth from '@/store/auth';

const Login = () => {
  const [username, setUsername] = useState('');  
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const [searchParams] = useSearchParams();

  const user    = useAuth(s => s.user);
  const doLogin = useAuth(s => s.login);
  const hydrate = useAuth(s => s.hydrate);

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
      await authApi.post('login', { username, password });

      const session = await api.post('/auth/ad-login', { email: username });

      doLogin(session);

      toast({
        title: 'Login realizado!',
        description: `Bem-vindo, ${session.user.name}!`,
      });
    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.error;

      if (status === 404 && msg === 'USER_NOT_FOUND') {
        toast({
          title: 'Acesso não autorizado',
          description: 'Você autenticou no AD, mas não possui cadastro no sistema. Solicite acesso ao SETISD.',
          variant: 'destructive',
        });
      } else if (status === 401) {
        toast({
          title: 'Falha na autenticação',
          description: 'Usuário ou senha inválidos (AD).',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro no login',
          description: err?.message || 'Não foi possível autenticar.',
          variant: 'destructive',
        });
      }
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
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              type="text"                
              placeholder="usuário de rede"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-12"
              disabled={loading}
              autoComplete="username"
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
              autoComplete="current-password"
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
            Use suas credenciais de rede EBSERH. Em caso de dúvida, contate o SETISD.
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
