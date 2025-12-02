export interface Device {
  id: number;
  manufacturer?: string;
  name: string;
  category: string;
  sub_category?: string;
  brand: string;
  model: string;
  description?: string;
  short_description?: string;
  phase?: string;
  cost_price: number;
  retail_price?: number;
  markup?: number;
  discount?: number;
  selling_price: number;
  supplier?: string;
  is_taxable?: boolean;
  specifications?: string;
  custom_field_1?: string;
  custom_field_2?: string;
  custom_field_3?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDeviceRequest {
  manufacturer?: string;
  name: string;
  category: string;
  sub_category?: string;
  brand: string;
  model: string;
  description?: string;
  short_description?: string;
  phase?: string;
  cost_price: number;
  retail_price?: number;
  markup?: number;
  discount?: number;
  selling_price: number;
  supplier?: string;
  is_taxable?: boolean;
  specifications?: string;
  custom_field_1?: string;
  custom_field_2?: string;
  custom_field_3?: string;
  image?: File;
}