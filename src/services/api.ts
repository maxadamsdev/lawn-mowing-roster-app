import { User, Session } from '../types';

const API_URL = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response.json();
}

export const authApi = {
  login: async (name: string, password?: string) => {
    return apiCall<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    });
  },
};

export const usersApi = {
  getAll: async () => {
    return apiCall<{ users: User[] }>('/users');
  },
  
  create: async (name: string, email: string, phone: string, isAdmin: boolean = false) => {
    return apiCall<{ user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, isAdmin }),
    });
  },
  
  update: async (id: string, data: Partial<User>) => {
    return apiCall<{ user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiCall<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

export const sessionsApi = {
  getAll: async () => {
    return apiCall<{ sessions: Session[] }>('/sessions');
  },
  
  assign: async (id: string, userId: string) => {
    return apiCall<{ session: Session }>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    });
  },
  
  confirm: async (
    id: string,
    arrivalDay?: string,
    arrivalTime?: string,
    needsAssistance: boolean = false
  ) => {
    return apiCall<{ session: Session }>(`/sessions/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ arrivalDay, arrivalTime, needsAssistance }),
    });
  },
  
  withdraw: async (id: string) => {
    return apiCall<{ session: Session }>(`/sessions/${id}/withdraw`, {
      method: 'PUT',
    });
  },
  
  requestCoverage: async (id: string, assignedUser: User) => {
    return apiCall<{ recipients: string[] }>(`/sessions/${id}/request-coverage`, {
      method: 'POST',
      body: JSON.stringify({ assignedUser }),
    });
  },
};

