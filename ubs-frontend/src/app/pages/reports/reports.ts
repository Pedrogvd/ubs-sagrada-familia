import { Component, OnInit, signal, computed } from '@angular/core';
import { Reports as ReportsService, MonthlyReport } from '../../services/reports';
import { CONDITION_OPTIONS } from '../patient-form/patient-form';

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

@Component({
  selector: 'app-reports',
  imports: [],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  viewDate = signal<Date>(this.startOfMonth(new Date()));
  report = signal<MonthlyReport | null>(null);
  loading = signal(false);

  monthLabel = computed(() => {
    const d = this.viewDate();
    return `${MONTH_LABELS[d.getMonth()]} de ${d.getFullYear()}`;
  });

  private conditionLabels = new Map(CONDITION_OPTIONS.map((option) => [option.value, option.label]));

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadReport();
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
    this.loading.set(true);
    this.reportsService.getMonthly(this.monthParam()).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
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