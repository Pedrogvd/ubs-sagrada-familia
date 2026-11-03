import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth as AuthService } from './services/auth';
import { Loading as LoadingService } from './services/loading';
import { SessionExpiredModal } from './components/session-expired-modal/session-expired-modal';
import { ChangePasswordModal } from './components/change-password-modal/change-password-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SessionExpiredModal, ChangePasswordModal],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ubs-frontend');
  isLoggedIn;
  isLoading;
  mobileMenuOpen = signal(false);
  userMenuOpen = signal(false);
  changePasswordOpen = signal(false);

  constructor(private authService: AuthService, private loadingService: LoadingService, private router: Router) {
    this.isLoggedIn = this.authService.isLoggedIn;
    this.isLoading = this.loadingService.isLoading;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getUserName(): string {
    return this.authService.getName() ?? '';
  }

  // iniciais pro avatar do topo, tipo "Pedro Gabriel" -> "PG"
  userInitials(): string {
    const name = this.authService.getName();
    if (!name) return '?';

    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';

    return (first + last).toUpperCase();
  }

  toggleUserMenu(): void {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  onOpenChangePassword(): void {
    this.userMenuOpen.set(false);
    this.changePasswordOpen.set(true);
  }

  onCloseChangePassword(): void {
    this.changePasswordOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}