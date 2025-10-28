import authApi from '@/services/authApi';
import {api} from '@/lib/api';               // import default (sem chaves)
import useAuth from '@/store/auth';
import { toast } from '@/components/ui/use-toast';

const HOSPITAL_OUS = ['OU=HUWC', 'OU=MEAC', 'OU=UFC'];

function isInAllowedOU(dn) {
  if (!dn) return false;
  return HOSPITAL_OUS.some((frag) => dn.includes(frag));
}

export async function loginWithActiveDirectory(username, password) {
  const { data: adRes } = await authApi.post('login', { username, password });
  const { token: adToken, userData } = adRes || {};
  if (!userData?.dn) throw new Error('Resposta do AD sem DN.');
  if (!isInAllowedOU(userData.dn)) {
    throw new Error('Usuário deve estar na OU permitida (HUWC/MEAC/UFC).');
  }

  try {
    const { data: session } = await api.post('/auth/ad-login', {
      username: userData.sAMAccountName || username,
      dn: userData.dn,
      email: userData.mail,
      name: userData.cn,
    });

    useAuth.getState().login(session);
    toast({ title: 'Login realizado com sucesso!' });
    return session;

  } catch (err) {
    const status = err?.response?.status;
    if (status === 404 || status === 422) {
      toast({
        title: 'Acesso negado',
        description: 'Seu usuário não está cadastrado no sistema.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Falha no login',
        description: `Erro ao validar com a API (${status ?? 'desconhecido'}).`,
        variant: 'destructive',
      });
    }
    throw err;
  }
}
