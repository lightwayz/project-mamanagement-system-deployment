export interface Project {
  id: number;
  name: string;
  description: string;
  client_id?: number;
  client?: Client;
  salesperson_id?: number;
  salesperson?: User;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  total_cost: number;
  created_at: string;
  updated_at: string;
  locations?: ProjectLocation[];
  tasks?: Task[];
  files?: ProjectFile[];
}

export interface ProjectLocation {
  id: number;
  project_id: number;
  parent_location_id?: number;
  level: number;
  name: string;
  description?: string;
  devices?: ProjectDevice[];
  parent?: ProjectLocation;
  subLocations?: ProjectLocation[];
  total_cost?: number;
  total_devices?: number;
  full_path?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDevice {
  id: number;
  project_location_id: number;
  device_id: number;
  device?: Device;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to?: number;
  assignee?: User;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: number;
  project_id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  uploader?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  client_id?: number;
  salesperson_id?: number;
  start_date?: string;
  end_date?: string;
  locations?: CreateProjectLocationRequest[];
}

export interface CreateProjectLocationRequest {
  name: string;
  description?: string;
  parent_location_id?: number;
  level?: number;
  devices?: CreateProjectDeviceRequest[];
  subLocations?: CreateProjectLocationRequest[];
}

export interface CreateProjectDeviceRequest {
  device_id: number;
  quantity: number;
  unit_price: number;
}

export interface ProjectDeviceAssociationRequest {
  location_id: number;
  devices: CreateProjectDeviceRequest[];
}

export interface UpdateProjectDeviceRequest {
  quantity: number;
  unit_price: number;
}

export interface DeviceSelectionItem extends Device {
  selected?: boolean;
  selectedQuantity?: number;
  selectedPrice?: number;
  assignedLocation?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  client_id?: number | null;
  salesperson_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

import { Client } from './client.model';
import { User } from './user.model';
import { Device } from './device.model';