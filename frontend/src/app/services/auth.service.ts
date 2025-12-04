import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }
  // ===========================================
// MOCK METHODS FOR DEMO PHASE (NO BACKEND ROUTE)
// ===========================================
  getPasswordExpiryStatus(): Observable<any> {
    return new Observable(observer => {
      observer.next({
        expiryInDays: 999,       // fake far expiration
        passwordStatus: 'valid', // fake status
        requiresChange: false
      });
      observer.complete();
    });
  }

  initializePasswordExpiry(): Observable<any> {
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }

  // ===========================================
  // LOGIN
  // ===========================================
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const url = `${this.apiUrl}/login`;

    return this.http.post<LoginResponse>(url, credentials).pipe(
        tap(response => {
          this.setToken(response.token);
          this.setCurrentUser(response.user);
          this.logSessionState();
        })
    );
  }

  // ===========================================
  // LOGOUT
  // ===========================================
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  // ===========================================
  // SESSION ACCESSORS
  // ===========================================
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ===========================================
  // USER ROLES (OPTIONAL)
  // ===========================================
  hasRole(role: string): boolean {
    return this.getCurrentUser()?.role === role;
  }

  isAdmin(): boolean { return this.hasRole('admin'); }
  isSalesperson(): boolean { return this.hasRole('salesperson'); }
  isTechnician(): boolean { return this.hasRole('technician'); }

  // ===========================================
  // SESSION HYDRATION
  // ===========================================
  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  loadUserFromStorage(): void {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        this.currentUserSubject.next(JSON.parse(userJson));
      }
    } catch (err) {
      console.error("Failed to load stored user", err);
    }
  }

  // ===========================================
  // DEBUGGING (REMOVE WHEN LIVE)
  // ===========================================
  private logSessionState(): void {
    console.log("SESSION TOKEN:", this.getToken());
    console.log("SESSION USER:", this.getCurrentUser());
  }
}
