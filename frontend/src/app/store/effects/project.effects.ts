import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

@Injectable()
export class ProjectEffects {
  constructor(
    private actions$: Actions,
    private apiService: ApiService
  ) {}

  // Effects would be defined here
}