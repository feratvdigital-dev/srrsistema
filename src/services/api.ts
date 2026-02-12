// API Service Layer - connects to PHP/MySQL backend on CPanel
// Change this to your CPanel domain when deploying
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return { success: false, error: 'Erro de conexão com o servidor' };
  }
}

// ===== Orders =====
export const ordersApi = {
  getAll: () => request<any[]>('/orders.php'),
  getById: (id: number) => request<any>(`/orders.php?id=${id}`),
  create: (order: any) => request<any>('/orders.php', { method: 'POST', body: JSON.stringify(order) }),
  update: (id: number, updates: any) => request<any>('/orders.php', { method: 'PUT', body: JSON.stringify({ id, ...updates }) }),
  delete: (id: number) => request<void>(`/orders.php?id=${id}`, { method: 'DELETE' }),
};

// ===== Technicians =====
export const techniciansApi = {
  getAll: () => request<any[]>('/technicians.php'),
  create: (tech: any) => request<any>('/technicians.php', { method: 'POST', body: JSON.stringify(tech) }),
  update: (id: string, updates: any) => request<any>('/technicians.php', { method: 'PUT', body: JSON.stringify({ id, ...updates }) }),
  delete: (id: string) => request<void>(`/technicians.php?id=${id}`, { method: 'DELETE' }),
};

// ===== Auth =====
export const authApi = {
  login: (username: string, password: string) => request<any>('/auth.php', { method: 'POST', body: JSON.stringify({ username, password }) }),
};

// ===== Tickets =====
export const ticketsApi = {
  getAll: () => request<any[]>('/tickets.php'),
  getById: (id: string) => request<any>(`/tickets.php?id=${id}`),
  create: (ticket: any) => request<any>('/tickets.php', { method: 'POST', body: JSON.stringify(ticket) }),
  update: (id: string, updates: any) => request<any>('/tickets.php', { method: 'PUT', body: JSON.stringify({ id, ...updates }) }),
  delete: (id: string) => request<void>(`/tickets.php?id=${id}`, { method: 'DELETE' }),
};

export default { ordersApi, techniciansApi, authApi, ticketsApi };
