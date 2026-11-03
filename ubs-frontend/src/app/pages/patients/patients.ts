import { Component, OnInit, signal, computed } from '@angular/core';
import { Patients as PatientsService, Patient } from '../../services/patients';
import { Auth as AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Pagination } from '../../components/pagination/pagination';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-patients',
  imports: [RouterLink, DatePipe, Pagination],
  templateUrl: './patients.html',
  styleUrl: './patients.scss',
})
export class Patients implements OnInit {
  patients = signal<Patient[]>([]);
  currentPage = signal(1);

  searchTerm = signal('');
  priorityFilter = signal<'all' | Patient['priority']>('all');
  alertFilter = signal<'all' | NonNullable<Patient['alertLevel']>>('all');
  activeFilter = signal<'all' | 'active' | 'inactive'>('all');

  filteredPatients = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const priority = this.priorityFilter();
    const alert = this.alertFilter();
    const active = this.activeFilter();

    return this.patients().filter((patient) => {
      if (search && !patient.name.toLowerCase().includes(search)) return false;
      if (priority !== 'all' && patient.priority !== priority) return false;
      if (alert !== 'all' && patient.alertLevel !== alert) return false;
      if (active === 'active' && !patient.active) return false;
      if (active === 'inactive' && patient.active) return false;
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
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.patientsService.list().subscribe((data) => {
      this.patients.set(data);
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onSearchChange(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onPriorityFilterChange(event: Event): void {
    this.priorityFilter.set((event.target as HTMLSelectElement).value as 'all' | Patient['priority']);
    this.currentPage.set(1);
  }

  onAlertFilterChange(event: Event): void {
    this.alertFilter.set((event.target as HTMLSelectElement).value as 'all' | NonNullable<Patient['alertLevel']>);
    this.currentPage.set(1);
  }

  onActiveFilterChange(event: Event): void {
    this.activeFilter.set((event.target as HTMLSelectElement).value as 'all' | 'active' | 'inactive');
    this.currentPage.set(1);
  }

  alertLabel(level: Patient['alertLevel']): string {
    switch (level) {
      case 'critical': return 'Crítico';
      case 'overdue': return 'Atrasado';
      case 'upcoming': return 'Em breve';
      case 'ok': return 'Em dia';
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