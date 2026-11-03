import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth as AuthService } from '../../services/auth';

@Component({
  selector: 'app-session-expired-modal',
  imports: [],
  templateUrl: './session-expired-modal.html',
  styleUrl: './session-expired-modal.scss',
})
export class SessionExpiredModal {
  isOpen;

  constructor(private authService: AuthService, private router: Router) {
    this.isOpen = this.authService.sessionExpired;
  }

  onGoToLogin(): void {
    this.authService.dismissSessionExpired();
    this.router.navigate(['/login']);
  }
}