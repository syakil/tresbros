import { cookies } from 'next/headers';

// Fallback to http://localhost:5052 if not defined in .env
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5052';

const getAuthHeaders = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('tresbros_token')?.value;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch (error) {
    // cookies() throws if called from Client Components without transitioning to Server Components.
    return {};
  }
};

export const backendClient = {
  get: async (endpoint: string, init?: RequestInit) => {
    const authHeaders = await getAuthHeaders();
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    if (authHeaders.Authorization) headers.set('Authorization', authHeaders.Authorization);

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      cache: 'no-store',
      ...init,
      headers
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized");
      throw new Error(`GET ${endpoint} failed: ${res.statusText}`);
    }
    
    // Some endpoints might return 204 No Content
    if (res.status === 204) return null;
    return res.json();
  },

  post: async (endpoint: string, body: any, init?: RequestInit) => {
    const authHeaders = await getAuthHeaders();
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    if (authHeaders.Authorization) headers.set('Authorization', authHeaders.Authorization);

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...init,
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        let errorMsg = res.statusText;
        try {
            const errBody = await res.json();
            errorMsg = errBody.error || errBody.message || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
    }
    if (res.status === 204) return null;
    return res.json();
  },

  put: async (endpoint: string, body: any, init?: RequestInit) => {
    const authHeaders = await getAuthHeaders();
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    if (authHeaders.Authorization) headers.set('Authorization', authHeaders.Authorization);

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...init,
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized");
      throw new Error(`PUT ${endpoint} failed: ${res.statusText}`);
    }
    if (res.status === 204) return null;
    return res.json();
  },

  delete: async (endpoint: string, init?: RequestInit) => {
    const authHeaders = await getAuthHeaders();
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    if (authHeaders.Authorization) headers.set('Authorization', authHeaders.Authorization);

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...init,
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized");
      throw new Error(`DELETE ${endpoint} failed: ${res.statusText}`);
    }
    if (res.status === 204) return null;
    return res.json();
  },
};
