import { ActionReducerMap } from '@ngrx/store';
import * as fromAuth from './auth.reducer';
import * as fromProject from './project.reducer';
import * as fromClient from './client.reducer';

export interface AppState {
  auth: fromAuth.AuthState;
  project: fromProject.ProjectState;
  client: fromClient.ClientState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: fromAuth.authReducer,
  project: fromProject.projectReducer,
  client: fromClient.clientReducer,
};