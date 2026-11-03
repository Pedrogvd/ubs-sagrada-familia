import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Patients as PatientsService, Patient } from '../../services/patients';
import { Visits as VisitsService, Visit } from '../../services/visits';

interface DayCell {
  date: Date;
  dateKey: string;
  isToday: boolean;
  isPast: boolean;
  dueVisits: Patient[];
  completedVisits: { visit: Visit; patientName: string }[];
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

@Component({
  selector: 'app-visits-calendar',
  imports: [RouterLink],
  templateUrl: './visits-calendar.html',
  styleUrl: './visits-calendar.scss',
})
export class VisitsCalendar implements OnInit {
  weekdayLabels = WEEKDAY_LABELS;

  allPatients = signal<Patient[]>([]);
  allVisits = signal<Visit[]>([]);

  viewDate = signal<Date>(this.startOfMonth(new Date()));

  monthLabel = computed(() => {
    const d = this.viewDate();
    return `${MONTH_LABELS[d.getMonth()]} de ${d.getFullYear()}`;
  });

  // null = espaço vazio (só pra alinhar a grade); nunca é um dia de outro mês
  calendarDays = computed<(DayCell | null)[]>(() => {
    const viewDate = this.viewDate();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0); // dia 0 do mês seguinte = último dia deste mês
    const leadingBlanks = firstOfMonth.getDay(); // 0 = domingo
    const daysInMonth = lastOfMonth.getDate();

    const todayKey = this.dateKeyFromDate(new Date());
    const patients = this.allPatients();
    const visits = this.allVisits();

    const cells: (DayCell | null)[] = [];

    for (let i = 0; i < leadingBlanks; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = this.dateKeyFromDate(date);

      const dueVisits = patients.filter(
        (p) => p.active && p.nextVisitDue && this.dateKeyFromString(p.nextVisitDue) === dateKey
      );

      const completedVisits = visits
        .filter((v) => this.dateKeyFromString(v.visitDate) === dateKey)
        .map((visit) => ({
          visit,
          patientName: patients.find((p) => p.id === visit.patientId)?.name ?? 'Paciente',
        }));

      cells.push({
        date,
        dateKey,
        isToday: dateKey === todayKey,
        isPast: dateKey < todayKey,
        dueVisits,
        completedVisits,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  });

  constructor(
    private patientsService: PatientsService,
    private visitsService: VisitsService
  ) {}

  ngOnInit(): void {
    this.patientsService.list().subscribe((data) => this.allPatients.set(data));
    this.visitsService.list().subscribe((data) => this.allVisits.set(data));
  }

  previousMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.viewDate.set(this.startOfMonth(new Date()));
  }

  outcomeLabel(outcome: Visit['outcome']): string {
    switch (outcome) {
      case 'completed': return 'Realizada';
      case 'patient_absent': return 'Ausente';
      case 'refused': return 'Recusou';
      default: return '-';
    }
  }

  visitTimeLabel(visitDate: string): string {
    return visitDate.slice(11, 16);
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private dateKeyFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private dateKeyFromString(isoLikeString: string): string {
    return isoLikeString.slice(0, 10);
  }
}