export type ServiceType = 'hydraulic' | 'electrical' | 'both';
export type OrderStatus = 'open' | 'executing' | 'executed' | 'closed';

export interface PhotoSet {
  before: string[];
  during: string[];
  after: string[];
}

export interface ServiceOrder {
  id: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
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
  executedAt?: string;
  closedAt?: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  hydraulic: 'Hidráulica',
  electrical: 'Elétrica',
  both: 'Ambos',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  open: 'Em Aberto',
  executing: 'Em Execução',
  executed: 'Executado',
  closed: 'Encerrado',
};
