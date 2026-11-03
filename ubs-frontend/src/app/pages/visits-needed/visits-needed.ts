import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Patients as PatientsService, Patient } from '../../services/patients';
import { HealthProfessionals as HealthProfessionalsService, HealthProfessional } from '../../services/health-professionals';
import { Auth as AuthService } from '../../services/auth';
import { Pagination } from '../../components/pagination/pagination';

const PRIORITY_RANK: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const PAGE_SIZE = 5;

@Component({
  selector: 'app-visits-needed',
  imports: [RouterLink, DatePipe, Pagination],
  templateUrl: './visits-needed.html',
  styleUrl: './visits-needed.scss',
})
export class VisitsNeeded implements OnInit {
  allPatients = signal<Patient[]>([]);
  healthProfessionals = signal<HealthProfessional[]>([]);
  currentPage = signal(1);

  searchTerm = signal('');
  acsFilter = signal<'all' | string>('all');

  patientsNeedingVisit = computed(() => {
    return this.allPatients()
      // sem nextVisitDue = nunca foi visitado e ainda não aparece em nenhum dia da Agenda
      .filter((patient) => patient.active && !patient.nextVisitDue)
      .sort((a, b) => {
        const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // entre pacientes de mesma prioridade, quem está esperando há mais tempo vai primeiro
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  });

  filteredPatients = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const acs = this.acsFilter();

    return this.patientsNeedingVisit().filter((patient) => {
      if (search && !patient.name.toLowerCase().includes(search)) return false;
      if (acs !== 'all' && patient.acsResponsavelId !== acs) return false;
      return true;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredPatients().length / PAGE_SIZE)));

  pagedPatients = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredPatients().slice(start, start + PAGE_SIZE);
  });

  constructor(
    private patientsService: PatientsService,
    private healthProfessionalsService: HealthProfessionalsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.patientsService.list().subscribe((data) => {
      this.allPatients.set(data);
    });

    this.healthProfessionalsService.list().subscribe((data) => {
      this.healthProfessionals.set(data);
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onSearchChange(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onAcsFilterChange(event: Event): void {
    this.acsFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  acsName(acsResponsavelId: string): string {
    if (!acsResponsavelId) return '-';
    const professional = this.healthProfessionals().find((p) => p.id === acsResponsavelId);
    return professional?.name ?? '-';
  }

  priorityLabel(priority: Patient['priority']): string {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return '-';
    }
  }
}