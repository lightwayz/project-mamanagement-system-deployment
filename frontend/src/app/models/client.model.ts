export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  notes?: string;
}