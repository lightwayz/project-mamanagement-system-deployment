import { createReducer, on } from '@ngrx/store';
import { Client } from '../../models/client.model';

export interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,
};

export const clientReducer = createReducer(
  initialState,
  // Actions would be defined here
);