import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
          console.error('Client-side error:', error.error.message);
        } else {
          // Server-side error
          console.error(
            `Backend returned code ${error.status}, ` +
            `body was: ${JSON.stringify(error.error)}`
          );

          // Handle specific HTTP status codes
          switch (error.status) {
            case 0:
              errorMessage = 'Unable to connect to the server. Please check your internet connection.';
              break;
            case 400:
              errorMessage = error.error?.message || error.error?.error || 'Bad request. Please check your input.';
              break;
            case 401:
              errorMessage = 'Your session has expired. Please log in again.';
              this.router.navigate(['/login']);
              break;
            case 403:
              errorMessage = 'You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = error.error?.message || error.error?.error || 'The requested resource was not found.';
              break;
            case 422:
              // Validation errors
              if (error.error?.errors) {
                const validationErrors = Object.values(error.error.errors).flat();
                errorMessage = validationErrors.join(', ');
              } else {
                errorMessage = error.error?.message || 'Validation failed.';
              }
              break;
            case 500:
              errorMessage = error.error?.message || 'An internal server error occurred. Please try again later.';
              break;
            case 503:
              errorMessage = 'The service is temporarily unavailable. Please try again later.';
              break;
            default:
              if (error.error?.message) {
                errorMessage = error.error.message;
              } else if (error.error?.error) {
                errorMessage = error.error.error;
              } else {
                errorMessage = `Server error: ${error.status}`;
              }
          }
        }

        // Show user-friendly error message
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });

        // Return error for component-level handling if needed
        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          originalError: error
        }));
      })
    );
  }
}
