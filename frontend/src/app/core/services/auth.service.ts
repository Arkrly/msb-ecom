import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { UserResponse, LoginRequest, SignupRequest } from '../models/auth.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authUrl = environment.authServiceUrl;
  private readonly currentUser = signal<UserResponse | null>(null);
  private readonly isLoading = signal(false);

  readonly user = this.currentUser.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        this.currentUser.set(JSON.parse(userStr));
      }
    }
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  signup(request: SignupRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.authUrl}/signup`, request).pipe(
      tap(user => this.handleAuthSuccess(user))
    );
  }

  login(request: LoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.authUrl}/login`, request).pipe(
      tap(user => this.handleAuthSuccess(user))
    );
  }

  logout(): void {
    this.clearUser();
  }

  private handleAuthSuccess(user: UserResponse): void {
    this.currentUser.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  clearUser(): void {
    this.currentUser.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}
