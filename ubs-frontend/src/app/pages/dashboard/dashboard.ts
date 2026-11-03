import { Component, OnInit, signal, computed } from '@angular/core';
import { Dashboard as DashboardService, DashboardSummary } from '../../services/dashboard';
import { Auth as AuthService } from '../../services/auth';
import { Reports as ReportsService, MonthlyReport } from '../../services/reports';
import { CONDITION_OPTIONS } from '../patient-form/patient-form';

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  summary = signal<DashboardSummary | null>(null);
  professionalName = signal<string | null>(null);

  viewDate = signal<Date>(this.startOfMonth(new Date()));
  report = signal<MonthlyReport | null>(null);
  reportLoading = signal(false);

  monthLabel = computed(() => {
    const d = this.viewDate();
    return `${MONTH_LABELS[d.getMonth()]} de ${d.getFullYear()}`;
  });

  private conditionLabels = new Map(CONDITION_OPTIONS.map((option) => [option.value, option.label]));

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private reportsService: ReportsService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe((data) => {
      this.summary.set(data);
    });

    this.professionalName.set(this.authService.getName());

    this.loadReport();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  previousMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.loadReport();
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.loadReport();
  }

  goToCurrentMonth(): void {
    this.viewDate.set(this.startOfMonth(new Date()));
    this.loadReport();
  }

  conditionLabel(condition: string): string {
    return this.conditionLabels.get(condition) ?? condition;
  }

  private loadReport(): void {
    this.reportLoading.set(true);
    this.reportsService.getMonthly(this.monthParam()).subscribe({
      next: (data) => {
        this.report.set(data);
        this.reportLoading.set(false);
      },
      error: () => {
        this.reportLoading.set(false);
      },
    });
  }

  private monthParam(): string {
    const d = this.viewDate();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}`;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
}