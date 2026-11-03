import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HealthProfessionals as HealthProfessionalsService, HealthProfessional } from '../../services/health-professionals';
import { Patients as PatientsService, Patient } from '../../services/patients';
import { Auth as AuthService } from '../../services/auth';
import { Pagination } from '../../components/pagination/pagination';

const PAGE_SIZE = 5;

type Tab = 'patients' | 'professionals';

@Component({
  selector: 'app-settings',
  imports: [RouterLink, Pagination],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  activeTab = signal<Tab>('patients');

  patients = signal<Patient[]>([]);
  patientsPage = signal(1);
  patientSearch = signal('');
  patientDeleteError = signal('');
  patientToDelete = signal<Patient | null>(null);
  deletingPatient = signal(false);

  filteredPatients = computed(() => {
    const search = this.patientSearch().trim().toLowerCase();
    if (!search) return this.patients();
    return this.patients().filter((patient) => patient.name.toLowerCase().includes(search));
  });

  patientsTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredPatients().length / PAGE_SIZE)));

  pagedPatients = computed(() => {
    const start = (this.patientsPage() - 1) * PAGE_SIZE;
    return this.filteredPatients().slice(start, start + PAGE_SIZE);
  });

  professionals = signal<HealthProfessional[]>([]);
  professionalsPage = signal(1);
  professionalSearch = signal('');

  filteredProfessionals = computed(() => {
    const search = this.professionalSearch().trim().toLowerCase();
    if (!search) return this.professionals();
    return this.professionals().filter((professional) => professional.name.toLowerCase().includes(search));
  });

  professionalsTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredProfessionals().length / PAGE_SIZE)));

  pagedProfessionals = computed(() => {
    const start = (this.professionalsPage() - 1) * PAGE_SIZE;
    return this.filteredProfessionals().slice(start, start + PAGE_SIZE);
  });

  constructor(
    private healthProfessionalsService: HealthProfessionalsService,
    private patientsService: PatientsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
    this.loadProfessionals();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  isSelf(professional: HealthProfessional): boolean {
    return professional.id === this.authService.getProfessionalId();
  }

  roleLabel(role: HealthProfessional['role']): string {
    return role === 'admin' ? 'Admin' : 'Profissional';
  }

  priorityLabel(priority: Patient['priority']): string {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return '-';
    }
  }

  onPatientSearchChange(event: Event): void {
    this.patientSearch.set((event.target as HTMLInputElement).value);
    this.patientsPage.set(1);
  }

  onProfessionalSearchChange(event: Event): void {
    this.professionalSearch.set((event.target as HTMLInputElement).value);
    this.professionalsPage.set(1);
  }

  private loadPatients(): void {
    this.patientsService.list().subscribe((data) => {
      this.patients.set(data);
    });
  }

  // exclusão de paciente de teste (ou qualquer cadastro indevido): some
  // junto o histórico de visitas e IVCF-20 dele, então pede confirmação num
  // modal do próprio site (em vez do confirm() nativo do navegador) antes —
  // não tem como desfazer.
  askDeletePatient(patient: Patient): void {
    this.patientDeleteError.set('');
    this.patientToDelete.set(patient);
  }

  cancelDeletePatient(): void {
    if (this.deletingPatient()) return; // evita fechar no meio de um pedido em andamento
    this.patientToDelete.set(null);
    this.patientDeleteError.set('');
  }

  confirmDeletePatient(): void {
    const patient = this.patientToDelete();
    if (!patient) return;

    this.deletingPatient.set(true);
    this.patientDeleteError.set('');

    this.patientsService.delete(patient.id).subscribe({
      next: () => {
        this.deletingPatient.set(false);
        this.patientToDelete.set(null);
        this.loadPatients();
      },
      error: () => {
        this.deletingPatient.set(false);
        this.patientDeleteError.set('Não foi possível excluir o paciente. Tente novamente.');
      },
    });
  }

  private loadProfessionals(): void {
    this.healthProfessionalsService.list().subscribe((data) => {
      this.professionals.set(data);
    });
  }
}