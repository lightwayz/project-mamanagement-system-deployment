import { createReducer, on } from '@ngrx/store';
import { User } from '../../models/user.model';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  // Actions would be defined here
);