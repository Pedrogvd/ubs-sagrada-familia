import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Patients as PatientsService, Patient } from '../../services/patients';
import { HealthProfessionals as HealthProfessionalsService } from '../../services/health-professionals';
import { Visits as VisitsService, Visit } from '../../services/visits';

@Component({
  selector: 'app-visit-history',
  imports: [DatePipe],
  templateUrl: './visit-history.html',
  styleUrl: './visit-history.scss',
})
export class VisitHistory implements OnInit {
  patient = signal<Patient | null>(null);
  patientId!: string;
  visits = signal<Visit[]>([]);
  professionalNames = signal<Record<string, string>>({});

  constructor(
    private route: ActivatedRoute,
    private patientsService: PatientsService,
    private healthProfessionalsService: HealthProfessionalsService,
    private visitsService: VisitsService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('patientId')!;

    this.patientsService.getById(this.patientId).subscribe((data) => this.patient.set(data));

    this.healthProfessionalsService.list().subscribe((professionals) => {
      const map: Record<string, string> = {};
      professionals.forEach((p) => {
        map[p.id] = p.name;
      });
      this.professionalNames.set(map);
    });

    this.visitsService.listByPatient(this.patientId).subscribe((data) => {
      this.visits.set(data);
    });
  }

  professionalName(id: string): string {
    return this.professionalNames()[id] ?? 'Profissional não encontrado';
  }

  outcomeLabel(outcome: Visit['outcome']): string {
    switch (outcome) {
      case 'completed':
        return 'Realizada';
      case 'patient_absent':
        return 'Paciente ausente';
      case 'refused':
        return 'Recusou a visita';
      default:
        return '-';
    }
  }
}
