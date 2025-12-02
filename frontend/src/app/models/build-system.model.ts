import { User } from './user.model';
import { Device } from './device.model';

export interface BuildSystem {
  id: number;
  name: string;
  description?: string;
  total_cost: number;
  created_by: number;
  creator?: User;
  is_active: boolean;
  locations?: BuildSystemLocation[];
  locations_count?: number;
  total_devices?: number;
  created_at: string;
  updated_at: string;
}

export interface BuildSystemLocation {
  id: number;
  build_system_id: number;
  parent_location_id?: number;
  level: number;
  name: string;
  description?: string;
  devices?: BuildSystemDevice[];
  parent?: BuildSystemLocation;
  subLocations?: BuildSystemLocation[];
  total_cost?: number;
  total_devices?: number;
  total_cost_with_sub_locations?: number;
  total_devices_with_sub_locations?: number;
  full_path?: string;
  created_at: string;
  updated_at: string;
}

export interface BuildSystemDevice {
  id: number;
  build_system_location_id: number;
  device_id: number;
  device?: Device;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBuildSystemRequest {
  name: string;
  description?: string;
  locations: CreateBuildSystemLocationRequest[];
}

export interface CreateBuildSystemLocationRequest {
  name: string;
  description?: string;
  parent_location_id?: number;
  level?: number;
  devices: CreateBuildSystemDeviceRequest[];
  subLocations?: CreateBuildSystemLocationRequest[];
}

export interface CreateBuildSystemDeviceRequest {
  device_id: number;
  quantity: number;
  unit_price: number;
}

export interface UpdateBuildSystemRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  locations?: UpdateBuildSystemLocationRequest[];
}

export interface UpdateBuildSystemLocationRequest {
  id?: number;
  name: string;
  description?: string;
  parent_location_id?: number;
  level?: number;
  devices: UpdateBuildSystemDeviceRequest[];
  subLocations?: UpdateBuildSystemLocationRequest[];
}

export interface UpdateBuildSystemDeviceRequest {
  id?: number;
  device_id: number;
  quantity: number;
  unit_price: number;
}

export interface BuildSystemImportRequest {
  project_id: number;
  location_mapping?: BuildSystemLocationMapping[];
}

export interface BuildSystemLocationMapping {
  build_system_location_id: number;
  project_location_name: string;
}

export interface BuildSystemDeviceSelectionItem extends Device {
  selected?: boolean;
  selectedQuantity?: number;
  selectedPrice?: number;
  assignedLocation?: string;
  quantity?: number;
  unit_price?: number;
}

export interface BuildSystemLocationStep {
  name: string;
  description?: string;
  parent_location_id?: number;
  level?: number;
  devices: BuildSystemDeviceSelectionItem[];
  subLocations?: BuildSystemLocationStep[];
  isExpanded?: boolean;
}

export interface BuildSystemImportResponse {
  message: string;
  imported_locations: number;
  total_cost_added: number;
}

export interface BuildSystemCloneResponse {
  message: string;
  build_system: BuildSystem;
}

export interface BuildSystemListResponse {
  data: BuildSystem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface BuildSystemFilters {
  search?: string;
  creator_id?: number;
  active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}