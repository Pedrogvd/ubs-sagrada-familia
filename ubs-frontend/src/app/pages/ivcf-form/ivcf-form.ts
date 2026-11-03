import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Patients as PatientsService, Patient } from '../../services/patients';
import {
  IvcfAssessments as IvcfAssessmentsService,
  IvcfAssessment,
  CreateIvcfAssessmentInput,
  IvcfAnswers,
  IvcfClassification,
} from '../../services/ivcf-assessments';

function toDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

@Component({
  selector: 'app-ivcf-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './ivcf-form.html',
  styleUrl: './ivcf-form.scss',
})
export class IvcfForm implements OnInit {
  patient = signal<Patient | null>(null);
  patientId!: string;
  today = toDateString(new Date());

  result = signal<IvcfAssessment | null>(null);
  errorMessage = signal('');

  form;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private patientsService: PatientsService,
    private ivcfAssessmentsService: IvcfAssessmentsService
  ) {
    this.form = this.fb.nonNullable.group({
      assessedAt: [this.today, Validators.required],
      age: ['60_74' as IvcfAnswers['age'], Validators.required],
      healthPerception: ['good' as IvcfAnswers['healthPerception'], Validators.required],
      avdInstrumental: this.fb.nonNullable.group({
        stoppedShopping: [false],
        stoppedManagingMoney: [false],
        stoppedHousework: [false],
      }),
      avdBasica: this.fb.nonNullable.group({
        stoppedBathingAlone: [false],
      }),
      cognition: this.fb.nonNullable.group({
        familyNoticedForgetfulness: [false],
        forgetfulnessWorsening: [false],
        forgetfulnessImpairsActivity: [false],
      }),
      humor: this.fb.nonNullable.group({
        discouragementSadnessHopelessness: [false],
        lossOfInterestOrPleasure: [false],
      }),
      mobility: this.fb.nonNullable.group({
        reachGrip: this.fb.nonNullable.group({
          cannotRaiseArmsAboveShoulder: [false],
          cannotHandleSmallObjects: [false],
        }),
        aerobicMuscular: this.fb.nonNullable.group({
          hasCondition: [false],
          unintentionalWeightLoss: [false],
          lowBmi: [false],
          smallCalfCircumference: [false],
          slowGaitSpeed: [false],
        }),
        gait: this.fb.nonNullable.group({
          difficultyImpairsActivity: [false],
          twoOrMoreFallsLastYear: [false],
        }),
        continence: this.fb.nonNullable.group({
          involuntaryLossOfUrineOrFeces: [false],
        }),
      }),
      communication: this.fb.nonNullable.group({
        visionImpairsActivity: [false],
        hearingImpairsActivity: [false],
      }),
      multipleComorbidity: this.fb.nonNullable.group({
        hasCondition: [false],
        fiveOrMoreChronicDiseases: [false],
        fiveOrMoreDailyMedications: [false],
        recentHospitalization: [false],
      }),
    });
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('patientId')!;

    this.patientsService.getById(this.patientId).subscribe((data) => {
      this.patient.set(data);
    });

    // pré-preenche com a última avaliação já feita desse paciente, se existir
    // (o documento é "um só" por paciente — reaplicar atualiza ele e guarda
    // o estado anterior no histórico)
    this.ivcfAssessmentsService.listByPatient(this.patientId).subscribe((assessments) => {
      const latest = assessments[0];
      if (!latest) return;

      this.form.patchValue({
        age: latest.answers.age,
        healthPerception: latest.answers.healthPerception,
        avdInstrumental: latest.answers.avdInstrumental,
        avdBasica: latest.answers.avdBasica,
        cognition: latest.answers.cognition,
        humor: latest.answers.humor,
        mobility: latest.answers.mobility,
        communication: latest.answers.communication,
        multipleComorbidity: latest.answers.multipleComorbidity,
      });
    });
  }

  classificationLabel(classification: IvcfClassification): string {
    switch (classification) {
      case 'baixa':
        return 'Baixa vulnerabilidade clínico-funcional';
      case 'moderada':
        return 'Moderada vulnerabilidade clínico-funcional';
      case 'alta':
        return 'Alta vulnerabilidade clínico-funcional';
      default:
        return '-';
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    const { assessedAt, ...answers } = this.form.getRawValue();

    const input: CreateIvcfAssessmentInput = {
      patientId: this.patientId,
      // assessedAt vem do <input type="date"> como "AAAA-MM-DD" (só data, sem hora).
      // new Date("AAAA-MM-DD") é interpretado como meia-noite UTC, o que no horário
      // do Brasil (UTC-3) já "volta" pro dia anterior quando exibido depois. Adicionar
      // T00:00:00 faz o JS tratar como meia-noite no fuso local, preservando o dia certo.
      assessedAt: new Date(`${assessedAt}T00:00:00`).toISOString(),
      answers: answers as IvcfAnswers,
    };

    this.ivcfAssessmentsService.create(input).subscribe({
      next: (assessment) => {
        this.result.set(assessment);
      },
      error: () => {
        this.errorMessage.set('Não foi possível salvar a avaliação. Tente novamente.');
      },
    });
  }
}
