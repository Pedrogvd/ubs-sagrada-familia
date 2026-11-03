import { Component, OnInit, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Patients as PatientsService, CreatePatientInput, UpdatePatientInput } from '../../services/patients';
import { HealthProfessionals as HealthProfessionalsService, HealthProfessional } from '../../services/health-professionals';
import { Auth as AuthService } from '../../services/auth';

export const CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'hypertension', label: 'Hipertensão' },
  { value: 'pregnant', label: 'Gestante' },
  { value: 'postpartum', label: 'Puérpera' },
  { value: 'child_under_2', label: 'Criança menor de 2 anos' },
  { value: 'bedridden_elderly', label: 'Idoso acamado' },
  { value: 'frail_elderly', label: 'Idoso frágil' },
  { value: 'physical_disability', label: 'Deficiência física' },
  { value: 'mental_disorder', label: 'Transtorno mental' },
  { value: 'tuberculosis', label: 'Tuberculose' },
  { value: 'leprosy', label: 'Hanseníase' },
  { value: 'substance_dependency', label: 'Dependência química' },
];

// "AAAA-MM-DD" (data pura, sem hora) a partir de um Date, usando os
// componentes LOCAIS (não toISOString(), que usa UTC e, no horário de
// Brasília, pode "adiantar" a data em até 3h perto da meia-noite — foi
// exatamente esse tipo de bug que corrigimos no formulário do IVCF-20).
function toLocalDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Interpreta "AAAA-MM-DD" como meia-noite no fuso LOCAL. new Date("AAAA-MM-DD")
// sem isso trata a string como UTC, o que no horário de Brasília "atrasa" a
// data em até 3h — o mesmo problema, só que ao ler a data em vez de salvar.
function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Validator customizado: rejeita datas depois de hoje
function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const inputDate = parseLocalDate(control.value);
  const today = parseLocalDate(toLocalDateString(new Date()));

  return inputDate > today ? { futureDate: true } : null;
}

// Mensagem de erro por campo, indexada pela chave do erro (required, pattern, futureDate...)
const FIELD_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  name: { required: 'Nome é obrigatório' },
  cpf: { required: 'CPF é obrigatório', pattern: 'CPF deve ter 11 dígitos' },
  address: { required: 'Endereço é obrigatório' },
  phoneNumber: { required: 'Telefone é obrigatório', pattern: 'Telefone deve ter 10 ou 11 dígitos (com DDD)' },
  dateOfBirth: { required: 'Data de nascimento é obrigatória', futureDate: 'Data de nascimento não pode ser no futuro' },
  cns: { pattern: 'CNS deve ter 15 dígitos' },
  priority: { required: 'Prioridade é obrigatória' },
  visitPeriodicityDays: { required: 'Periodicidade é obrigatória' },
};

@Component({
  selector: 'app-patient-form',
  imports: [ReactiveFormsModule],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.scss',
})
export class PatientForm implements OnInit {
  form;
  conditionOptions = CONDITION_OPTIONS;
  selectedConditions: string[] = [];
  healthProfessionals = signal<HealthProfessional[]>([]);
  today = toLocalDateString(new Date()); // pro atributo max do input date

  activeHealthProfessionals = computed(() => this.healthProfessionals().filter((p) => p.active));

  isEditMode = signal(false);
  private patientId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private patientsService: PatientsService,
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
      dateOfBirth: ['', [Validators.required, notFutureDateValidator]],
      priority: ['medium' as 'high' | 'medium' | 'low', Validators.required],
      visitPeriodicityDays: [30, Validators.required],
      cns: ['', Validators.pattern(/^\d{15}$/)],
      microarea: [''],
      acsResponsavelId: [''],
      active: [true],
    });
  }

  ngOnInit(): void {
    this.healthProfessionalsService.list().subscribe((data) => {
      this.healthProfessionals.set(data);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEditMode.set(true);
    this.patientId = id;

    this.patientsService.getById(id).subscribe((patient) => {
      this.selectedConditions = [...patient.conditions];
      this.form.patchValue({
        name: patient.name,
        cpf: patient.cpf,
        address: patient.address,
        phoneNumber: patient.phoneNumber,
        dateOfBirth: patient.dateOfBirth,
        priority: patient.priority,
        visitPeriodicityDays: patient.visitPeriodicityDays,
        cns: patient.cns,
        microarea: patient.microarea,
        acsResponsavelId: patient.acsResponsavelId,
        active: patient.active,
      });
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isConditionSelected(value: string): boolean {
    return this.selectedConditions.includes(value);
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

  // Mesma lógica do formatCpf: guarda só os dígitos no form, mostra formatado no input
  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 11);

    this.form.get('phoneNumber')?.setValue(digitsOnly, { emitEvent: false });

    let formatted = digitsOnly;
    if (digitsOnly.length > 10) {
      // celular: (31) 98888-7777
      formatted = `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7)}`;
    } else if (digitsOnly.length > 6) {
      // fixo: (31) 8888-7777
      formatted = `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length > 2) {
      formatted = `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
    } else if (digitsOnly.length > 0) {
      formatted = `(${digitsOnly}`;
    }

    input.value = formatted;
  }

  toggleCondition(value: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedConditions = [...this.selectedConditions, value];
    } else {
      this.selectedConditions = this.selectedConditions.filter((c) => c !== value);
    }
  }

  // Retorna a mensagem de erro do campo, só depois que o usuário mexeu nele (touched)
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
      this.form.markAllAsTouched(); // garante que os erros apareçam mesmo se o submit disparar via Enter
      return;
    }

    const value = this.form.getRawValue();
    const destination = this.isAdmin() ? '/settings' : '/patients';

    if (this.isEditMode() && this.patientId) {
      const input: UpdatePatientInput = {
        ...value,
        conditions: this.selectedConditions,
      };

      this.patientsService.update(this.patientId, input).subscribe(() => {
        this.router.navigate([destination]);
      });
      return;
    }

    const input: CreatePatientInput = {
      ...value,
      conditions: this.selectedConditions,
    };

    this.patientsService.create(input).subscribe(() => {
      this.router.navigate([destination]);
    });
  }
}