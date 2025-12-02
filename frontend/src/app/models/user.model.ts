export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'salesperson' | 'technician';
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  password_changed_at?: string;
  password_expires_at?: string;
  force_password_change?: boolean;
}

export interface PasswordStatus {
  days_remaining: number;
  is_expired: boolean;
  is_expiring_soon: boolean;
  next_expiry_date: string;
  created_at: string;
  password_changed_at: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'admin' | 'salesperson' | 'technician';
  password?: string;
  generate_password?: boolean;
  force_password_change?: boolean;
}