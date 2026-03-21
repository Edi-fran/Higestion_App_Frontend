import { API_BASE_URL } from '../config';
import { storage } from './storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

function buildUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function safeMessage(response: Response) {
  try {
    const data = await response.json();
    return data.mensaje || data.message || `Error ${response.status}`;
  } catch {
    return `Error ${response.status}`;
  }
}

async function refreshAccessToken() {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) throw new Error('La sesión expiró. Inicia sesión nuevamente.');

  const response = await fetch(buildUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (!response.ok) {
    await storage.clearSession();
    throw new Error(await safeMessage(response));
  }

  const data = await response.json();
  if (!data.access_token) {
    await storage.clearSession();
    throw new Error('No se pudo renovar la sesión.');
  }
  await storage.updateAccessToken(data.access_token);
  return data.access_token as string;
}

async function request<T>(method: HttpMethod, path: string, options: { authenticated?: boolean; body?: BodyInit | null; headers?: Record<string, string> } = {}): Promise<T> {
  const authenticated = options.authenticated ?? true;
  let token = authenticated ? await storage.getAccessToken() : null;

  const execute = async (bearer: string | null) => fetch(buildUrl(path), {
    method,
    headers: {
      Accept: 'application/json',
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ?? null,
  });

  let response = await execute(token);

  if (authenticated && response.status === 401) {
    token = await refreshAccessToken();
    response = await execute(token);
  }

  if (!response.ok) {
    throw new Error(await safeMessage(response));
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export function apiGet<T>(path: string, authenticated = true) {
  return request<T>('GET', path, { authenticated });
}

export function apiPost<T>(path: string, body: unknown, authenticated = true) {
  return request<T>('POST', path, {
    authenticated,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, body: unknown, authenticated = true) {
  return request<T>('PUT', path, {
    authenticated,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string, authenticated = true) {
  return request<T>('DELETE', path, { authenticated });
}

export function apiPostForm<T>(path: string, formData: FormData, authenticated = true) {
  return request<T>('POST', path, { authenticated, body: formData });
}

export function toApiImage(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const root = API_BASE_URL.replace(/\/api$/, '');
  return `${root}/${path.replace(/^\/+/, '')}`;
}

export function toRootUrl(path: string) {
  const root = API_BASE_URL.replace(/\/api$/, '');
  return `${root}${path.startsWith('/') ? path : `/${path}`}`;
}
