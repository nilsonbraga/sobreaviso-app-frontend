// src/components/Login.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

const Login = () => {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const doLogin = useAuth(s => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // { token, refreshToken?, user: { id, name, email, role, teamId } }
      const session = await api.post('/auth/login', { email, password });
      doLogin(session);

      toast({
        title: 'Login realizado!',
        description: `Bem-vindo, ${session.user.name}!`,
      });

      // redirecione se quiser:
      // window.location.href = '/';
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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-20 h-20 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Área Administrativa</h2>
          <p className="text-gray-600">Faça login para gerenciar as escalas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12" disabled={loading} />
          </div>

          <Button type="submit" className="w-full h-12 text-lg" size="lg" disabled={loading}>
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong>Dica de acesso:</strong><br />
            Use o admin do seed do backend.<br />
            Email: <code>admin@sobreaviso.local</code><br />
            Senha: <code>admin123</code>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
