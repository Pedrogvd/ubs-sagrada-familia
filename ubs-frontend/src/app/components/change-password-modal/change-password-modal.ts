import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HealthProfessionals as HealthProfessionalsService } from '../../services/health-professionals';

const FIELD_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  currentPassword: { required: 'Senha atual é obrigatória' },
  newPassword: { required: 'Nova senha é obrigatória', minlength: 'Nova senha deve ter pelo menos 6 caracteres' },
  confirmPassword: { required: 'Confirme a nova senha' },
};

@Component({
  selector: 'app-change-password-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password-modal.html',
  styleUrl: './change-password-modal.scss',
})
export class ChangePasswordModal {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  form;
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private fb: FormBuilder, private healthProfessionalsService: HealthProfessionalsService) {
    this.form = this.fb.nonNullable.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();

    if (newPassword !== confirmPassword) {
      this.errorMessage.set('As senhas novas não coincidem');
      return;
    }

    this.errorMessage.set('');

    this.healthProfessionalsService.changeOwnPassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.successMessage.set('Senha alterada com sucesso!');
        this.form.reset();
      },
      error: (err) => {
        const apiMessage = err?.error?.error as string | undefined;
        this.errorMessage.set(
          apiMessage === 'current password is incorrect' ? 'Senha atual incorreta' : 'Não foi possível trocar a senha'
        );
      },
    });
  }

  getError(controlName: string): string | null {
    const control = this.form.get(controlName);

    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const messages = FIELD_ERROR_MESSAGES[controlName];
    const firstErrorKey = Object.keys(control.errors)[0];

    return messages?.[firstErrorKey] ?? 'Campo inválido';
  }

  onClose(): void {
    this.form.reset();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.closed.emit();
  }
}
