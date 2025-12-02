import { createReducer, on } from '@ngrx/store';
import { Project } from '../../models/project.model';

export interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
};

export const projectReducer = createReducer(
  initialState,
  // Actions would be defined here
);