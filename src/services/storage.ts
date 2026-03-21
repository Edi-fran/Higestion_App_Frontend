import AsyncStorage from '@react-native-async-storage/async-storage';
import { UsuarioAuth } from '../types';

const KEYS = {
  accessToken: 'hg_access_token',
  refreshToken: 'hg_refresh_token',
  user: 'hg_user'
};

export const storage = {
  async setSession(accessToken: string, refreshToken: string | undefined, user: UsuarioAuth) {
    await AsyncStorage.multiSet([
      [KEYS.accessToken, accessToken],
      [KEYS.refreshToken, refreshToken ?? ''],
      [KEYS.user, JSON.stringify(user)]
    ]);
  },
  async updateAccessToken(accessToken: string) {
    await AsyncStorage.setItem(KEYS.accessToken, accessToken);
  },
  async clearSession() {
    await AsyncStorage.multiRemove([KEYS.accessToken, KEYS.refreshToken, KEYS.user]);
  },
  async getAccessToken() {
    return AsyncStorage.getItem(KEYS.accessToken);
  },
  async getRefreshToken() {
    return AsyncStorage.getItem(KEYS.refreshToken);
  },
  async getUser(): Promise<UsuarioAuth | null> {
    const raw = await AsyncStorage.getItem(KEYS.user);
    return raw ? JSON.parse(raw) : null;
  },
  async setUser(user: UsuarioAuth) {
    await AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
  }
};
