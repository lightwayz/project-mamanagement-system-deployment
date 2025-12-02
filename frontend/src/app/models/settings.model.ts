export interface Settings {
  id: number;
  currency: string;
  company_name: string;
  company_logo?: string;
  tax_rate: number;
  default_labor_rate: number;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_encryption?: string;
  brand_primary_color?: string;
  brand_secondary_color?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  currency?: string;
  company_name?: string;
  company_logo?: string;
  tax_rate?: number;
  default_labor_rate?: number;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_encryption?: string;
  brand_primary_color?: string;
  brand_secondary_color?: string;
}