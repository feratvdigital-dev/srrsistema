export type ServiceType = 'hydraulic' | 'electrical' | 'both';
export type OrderStatus = 'open' | 'executing' | 'closed';

export interface PhotoSet {
  before: string[];
  during: string[];
  after: string[];
}

export interface ServiceOrder {
  id: number;
  clientName: string;
  clientPhone: string;
  serviceType: ServiceType;
  address: string;
  latitude?: number;
  longitude?: number;
  description: string;
  observation: string;
  photos: PhotoSet;
  laborCost: number;
  materialCost: number;
  materialDescription: string;
  status: OrderStatus;
  assignedTechnician: string;
  createdAt: string;
  closedAt?: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  hydraulic: 'Hidráulica',
  electrical: 'Elétrica',
  both: 'Hidráulica e Elétrica',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  open: 'Em Aberto',
  executing: 'Executando',
  closed: 'Encerrado',
};
