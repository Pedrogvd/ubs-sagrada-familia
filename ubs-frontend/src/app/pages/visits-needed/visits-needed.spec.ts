import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Patients as PatientsService, Patient } from '../../services/patients';
import { HealthProfessionals as HealthProfessionalsService, HealthProfessional } from '../../services/health-professionals';
import { Pagination } from '../../components/pagination/pagination';

const ALERT_PRIORITY: Record<string, number> = {
  critical: 0,
  overdue: 1,
  upcoming: 2,
  ok: 3,
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
  alertFilter = signal<'all' | 'critical' | 'overdue' | 'upcoming'>('all');
  acsFilter = signal<'all' | string>('all');

  patientsNeedingVisit = computed(() => {
    return this.allPatients()
      .filter((patient) => patient.active && patient.alertLevel && patient.alertLevel !== 'ok')
      .sort((a, b) => {
        const priorityDiff = ALERT_PRIORITY[a.alertLevel!] - ALERT_PRIORITY[b.alertLevel!];
        if (priorityDiff !== 0) return priorityDiff;

        const aLastVisit = a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0;
        const bLastVisit = b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0;
        return aLastVisit - bLastVisit;
      });
  });

  filteredPatients = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const alert = this.alertFilter();
    const acs = this.acsFilter();

    return this.patientsNeedingVisit().filter((patient) => {
      if (search && !patient.name.toLowerCase().includes(search)) return false;
      if (alert !== 'all' && patient.alertLevel !== alert) return false;
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
    private healthProfessionalsService: HealthProfessionalsService
  ) {}

  ngOnInit(): void {
    this.patientsService.list().subscribe((data) => {
      this.allPatients.set(data);
    });

    this.healthProfessionalsService.list().subscribe((data) => {
      this.healthProfessionals.set(data);
    });
  }

  onSearchChange(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onAlertFilterChange(event: Event): void {
    this.alertFilter.set((event.target as HTMLSelectElement).value as 'all' | 'critical' | 'overdue' | 'upcoming');
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

  alertLabel(level: Patient['alertLevel']): string {
    switch (level) {
      case 'critical': return 'Crítico';
      case 'overdue': return 'Atrasado';
      case 'upcoming': return 'Em breve';
      default: return '-';
    }
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