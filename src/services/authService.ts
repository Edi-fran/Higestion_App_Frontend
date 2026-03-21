import { Platform } from 'react-native';
import { API_BASE_URL } from '../config';
import { apiGet, apiPost } from './api';
import { storage } from './storage';
import { AuthResponse, TokenInfo, UsuarioAuth } from '../types';

function buildUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export const authService = {
  async login(username: string, password: string) {
    const data = await apiPost<AuthResponse>('/auth/login', {
      username,
      password,
      dispositivo: Platform.OS,
      sistema_operativo: Platform.Version?.toString?.() ?? 'desconocido'
    }, false);
    await storage.setSession(data.access_token, data.refresh_token, data.usuario);
    return data.usuario;
  },
  async me() {
    const me = await apiGet<any>('/auth/me');
    const user: UsuarioAuth = {
      id: me.id,
      nombre: me.nombre,
      username: me.username,
      email: me.email,
      telefono: me.telefono,
      rol: me.rol,
      foto_perfil: me.foto_perfil,
      estado: me.estado
    };
    await storage.setUser(user);
    return user;
  },
  async tokenInfo() {
    return apiGet<TokenInfo>('/auth/token-info');
  },
  async logout() {
    const refreshToken = await storage.getRefreshToken();
    try {
      if (refreshToken) {
        await fetch(buildUrl('/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${refreshToken}`
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      }
    } finally {
      await storage.clearSession();
    }
  }
};
