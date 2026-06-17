// frontend/src/lib/backendClient.ts

// Fallback to http://localhost:5052 if not defined in .env
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5052';

export const backendClient = {
  get: async (endpoint: string, init?: RequestInit) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.statusText}`);
    
    // Some endpoints might return 204 No Content
    if (res.status === 204) return null;
    return res.json();
  },

  post: async (endpoint: string, body: any, init?: RequestInit) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
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
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...init,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${endpoint} failed: ${res.statusText}`);
    if (res.status === 204) return null;
    return res.json();
  },

  delete: async (endpoint: string, init?: RequestInit) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...init,
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`DELETE ${endpoint} failed: ${res.statusText}`);
    if (res.status === 204) return null;
    return res.json();
  },
};
