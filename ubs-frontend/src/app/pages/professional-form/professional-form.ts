import { Component, OnInit, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HealthProfessionals as HealthProfessionalsService, HealthProfessional, CreateHealthProfessionalInput, UpdateHealthProfessionalInput } from '../../services/health-professionals';
import { Auth as AuthService } from '../../services/auth';

const FIELD_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  name: { required: 'Nome é obrigatório' },
  cpf: { required: 'CPF é obrigatório', pattern: 'CPF deve ter 11 dígitos' },
  address: { required: 'Endereço é obrigatório' },
  phoneNumber: { required: 'Telefone é obrigatório', pattern: 'Telefone deve ter 10 ou 11 dígitos (com DDD)' },
  email: { required: 'Email é obrigatório', email: 'Email inválido' },
  password: { required: 'Senha é obrigatória', minlength: 'Senha deve ter pelo menos 6 caracteres' },
};

@Component({
  selector: 'app-professional-form',
  imports: [ReactiveFormsModule],
  templateUrl: './professional-form.html',
  styleUrl: './professional-form.scss',
})
export class ProfessionalForm implements OnInit {
  form;
  isEditMode = signal(false);
  professional = signal<HealthProfessional | null>(null);
  private professionalId: string | null = null;

  resetPasswordResult = signal<string | null>(null);
  resetPasswordError = signal('');

  // admin editando o próprio perfil não pode mexer no próprio role/status
  isSelf = computed(() => this.professional()?.id === this.authService.getProfessionalId());

  constructor(
    private fb: FormBuilder,
    private healthProfessionalsService: HealthProfessionalsService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      address: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEditMode.set(true);
    this.professionalId = id;

    // editar não troca senha por aqui, então tira a exigência de preencher
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();

    this.loadProfessional(id);
  }

  roleLabel(role: HealthProfessional['role']): string {
    return role === 'admin' ? 'Admin' : 'Profissional';
  }

  toggleRole(): void {
    const current = this.professional();
    if (!current || !this.professionalId) return;

    const newRole = current.role === 'admin' ? 'professional' : 'admin';
    this.healthProfessionalsService.update(this.professionalId, { role: newRole }).subscribe(() => {
      this.loadProfessional(this.professionalId!);
    });
  }

  toggleActive(): void {
    const current = this.professional();
    if (!current || !this.professionalId) return;

    this.healthProfessionalsService.update(this.professionalId, { active: !current.active }).subscribe(() => {
      this.loadProfessional(this.professionalId!);
    });
  }

  // admin reseta a senha de outra pessoa; o backend gera uma temporária e devolve ela aqui,
  // já que não existe envio de email pra entregar a senha nova direto pro profissional
  resetPassword(): void {
    if (!this.professionalId) return;

    this.resetPasswordError.set('');
    this.resetPasswordResult.set(null);

    this.healthProfessionalsService.resetPassword(this.professionalId).subscribe({
      next: (response) => {
        this.resetPasswordResult.set(response.temporaryPassword ?? null);
      },
      error: () => {
        this.resetPasswordError.set('Não foi possível resetar a senha.');
      },
    });
  }

  restrictToDigits(controlName: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '');
    input.value = digitsOnly;
    this.form.get(controlName)?.setValue(digitsOnly, { emitEvent: false });
  }

  formatCpf(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 11);

    this.form.get('cpf')?.setValue(digitsOnly, { emitEvent: false });

    let formatted = digitsOnly;
    if (digitsOnly.length > 9) {
      formatted = `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3, 6)}.${digitsOnly.slice(6, 9)}-${digitsOnly.slice(9)}`;
    } else if (digitsOnly.length > 6) {
      formatted = `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3, 6)}.${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length > 3) {
      formatted = `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3)}`;
    }

    input.value = formatted;
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 11);

    this.form.get('phoneNumber')?.setValue(digitsOnly, { emitEvent: false });

    let formatted = digitsOnly;
    if (digitsOnly.length > 10) {
      formatted = `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7)}`;
    } else if (digitsOnly.length > 6) {
      formatted = `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length > 2) {
      formatted = `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
    } else if (digitsOnly.length > 0) {
      formatted = `(${digitsOnly}`;
    }

    input.value = formatted;
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, ...rest } = this.form.getRawValue();

    if (this.isEditMode() && this.professionalId) {
      const input: UpdateHealthProfessionalInput = rest;

      this.healthProfessionalsService.update(this.professionalId, input).subscribe(() => {
        this.router.navigate(['/settings']);
      });
      return;
    }

    const input: CreateHealthProfessionalInput = { ...rest, password };

    this.healthProfessionalsService.create(input).subscribe(() => {
      this.router.navigate(['/settings']);
    });
  }

  private loadProfessional(id: string): void {
    this.healthProfessionalsService.getById(id).subscribe((professional) => {
      this.professional.set(professional);
      this.form.patchValue({
        name: professional.name,
        cpf: professional.cpf,
        address: professional.address,
        phoneNumber: professional.phoneNumber,
        email: professional.email,
      });
    });
  }
}