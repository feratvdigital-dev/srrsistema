export interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: 'hydraulic' | 'electrical' | 'both';
  status: 'available' | 'busy' | 'offline';
  rg?: string;
  cpf?: string;
  profilePhoto?: string;
  documentPhoto?: string;
  username?: string;
  password?: string;
}

export const SPECIALTY_LABELS: Record<string, string> = {
  hydraulic: 'Hidráulica',
  electrical: 'Elétrica',
  both: 'Ambos',
};

export const TECH_STATUS_LABELS: Record<string, string> = {
  available: 'Disponível',
  busy: 'Ocupado',
  offline: 'Offline',
};
