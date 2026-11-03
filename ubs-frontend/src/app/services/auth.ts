import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginInput { email: string; password: string; }
export interface LoginResponse { token: string; name: string; }

const TOKEN_KEY = 'ubs_token';
const NAME_KEY = 'ubs_name';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private expirationTimeoutId: ReturnType<typeof setTimeout> | null = null;

  isLoggedIn = signal<boolean>(!!localStorage.getItem(TOKEN_KEY));
  sessionExpired = signal<boolean>(false);

  constructor(private http: HttpClient) {
    const existingToken = this.getToken();
    if (existingToken) {
      this.scheduleExpiration(existingToken);
    }
  }

  login(input: LoginInput): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, input).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(NAME_KEY, response.name);
        this.isLoggedIn.set(true);
        this.scheduleExpiration(response.token);
      })
    );
  }

  logout(): void {
    this.clearExpirationTimer();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    this.isLoggedIn.set(false);
  }

  expireSession(): void {
    this.logout();
    this.sessionExpired.set(true);
  }

  dismissSessionExpired(): void { this.sessionExpired.set(false); }
  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
  getName(): string | null { return localStorage.getItem(NAME_KEY); }

  getRole(): 'admin' | 'professional' | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeJwtPayload(token);
    return payload?.role ?? null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  getProfessionalId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeJwtPayload(token);
    return payload?.professionalId ?? null;
  }

  private scheduleExpiration(token: string): void {
    this.clearExpirationTimer();
    const payload = this.decodeJwtPayload(token);
    if (!payload?.exp) return;
    const expiresAtMs = payload.exp * 1000;
    const delayMs = expiresAtMs - Date.now();
    if (delayMs <= 0) { this.expireSession(); return; }
    this.expirationTimeoutId = setTimeout(() => this.expireSession(), delayMs);
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimeoutId) { clearTimeout(this.expirationTimeoutId); this.expirationTimeoutId = null; }
  }

  private decodeJwtPayload(token: string): { exp?: number; role?: 'admin' | 'professional'; professionalId?: string } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      return JSON.parse(atob(padded));
    } catch { return null; }
  }
}