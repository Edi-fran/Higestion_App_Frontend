import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { storage } from '../services/storage';
import { UsuarioAuth } from '../types';

export function useSession() {
  const [user, setUser] = useState<UsuarioAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const localUser = await storage.getUser();
        const token = await storage.getAccessToken();
        if (localUser && token) {
          const fresh = await authService.me();
          if (mounted) setUser(fresh);
        }
      } catch {
        await storage.clearSession();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function login(username: string, password: string) {
    const logged = await authService.login(username, password);
    const fresh = await authService.me().catch(() => logged);
    setUser(fresh);
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  async function reload() {
    const fresh = await authService.me();
    setUser(fresh);
  }

  return { user, loading, login, logout, reload, setUser };
}
