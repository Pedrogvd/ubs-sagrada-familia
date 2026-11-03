import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Patients as PatientsService, Patient } from '../../services/patients';
import { HealthProfessionals as HealthProfessionalsService } from '../../services/health-professionals';
import {
  IvcfAssessments as IvcfAssessmentsService,
  IvcfAssessment,
  IvcfAnswers,
  IvcfClassification,
} from '../../services/ivcf-assessments';

interface AnswerRow {
  number: string;
  text: string;
  value: string;
}

@Component({
  selector: 'app-ivcf-history',
  imports: [DatePipe],
  templateUrl: './ivcf-history.html',
  styleUrl: './ivcf-history.scss',
})
export class IvcfHistory implements OnInit {
  patient = signal<Patient | null>(null);
  patientId!: string;
  assessments = signal<IvcfAssessment[]>([]);
  professionalNames = signal<Record<string, string>>({});
  expandedId = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private patientsService: PatientsService,
    private healthProfessionalsService: HealthProfessionalsService,
    private ivcfAssessmentsService: IvcfAssessmentsService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('patientId')!;

    this.patientsService.getById(this.patientId).subscribe((data) => this.patient.set(data));

    // monta um mapa id -> nome pra mostrar "aplicado por" sem precisar de N requisições
    this.healthProfessionalsService.list().subscribe((professionals) => {
      const map: Record<string, string> = {};
      professionals.forEach((p) => {
        map[p.id] = p.name;
      });
      this.professionalNames.set(map);
    });

    this.ivcfAssessmentsService.listByPatient(this.patientId).subscribe((data) => {
      this.assessments.set(data);
    });
  }

  professionalName(id: string): string {
    return this.professionalNames()[id] ?? 'Profissional não encontrado';
  }

  classificationLabel(classification: IvcfClassification): string {
    switch (classification) {
      case 'baixa':
        return 'Baixa vulnerabilidade';
      case 'moderada':
        return 'Moderada vulnerabilidade';
      case 'alta':
        return 'Alta vulnerabilidade';
      default:
        return '-';
    }
  }

  toggleExpanded(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  // resume as 20 questões pontuadas do IVCF-20 em Sim/Não pra exibição no
  // histórico (os checkboxes informativos de apoio, como "perda de peso" ou
  // "IMC baixo", ficam de fora por não terem pontuação própria)
  flattenAnswers(a: IvcfAnswers): AnswerRow[] {
    const yn = (value: boolean) => (value ? 'Sim' : 'Não');

    return [
      {
        number: '1',
        text: 'Idade',
        value: a.age === '85_plus' ? '≥ 85 anos' : a.age === '75_84' ? '75 a 84 anos' : '60 a 74 anos',
      },
      {
        number: '2',
        text: 'Percepção da saúde',
        value: a.healthPerception === 'regular_bad' ? 'Regular ou ruim' : 'Excelente, muito boa ou boa',
      },
      { number: '3', text: 'Deixou de fazer compras por causa da saúde', value: yn(a.avdInstrumental.stoppedShopping) },
      { number: '4', text: 'Deixou de controlar dinheiro/contas por causa da saúde', value: yn(a.avdInstrumental.stoppedManagingMoney) },
      { number: '5', text: 'Deixou de fazer trabalhos domésticos leves por causa da saúde', value: yn(a.avdInstrumental.stoppedHousework) },
      { number: '6', text: 'Deixou de tomar banho sozinho por causa da saúde', value: yn(a.avdBasica.stoppedBathingAlone) },
      { number: '7', text: 'Familiar ou amigo notou esquecimento', value: yn(a.cognition.familyNoticedForgetfulness) },
      { number: '8', text: 'Esquecimento está piorando', value: yn(a.cognition.forgetfulnessWorsening) },
      { number: '9', text: 'Esquecimento impede atividade do cotidiano', value: yn(a.cognition.forgetfulnessImpairsActivity) },
      { number: '10', text: 'Desânimo, tristeza ou desesperança no último mês', value: yn(a.humor.discouragementSadnessHopelessness) },
      { number: '11', text: 'Perda de interesse ou prazer no último mês', value: yn(a.humor.lossOfInterestOrPleasure) },
      { number: '12', text: 'Incapaz de elevar os braços acima do ombro', value: yn(a.mobility.reachGrip.cannotRaiseArmsAboveShoulder) },
      { number: '13', text: 'Incapaz de manusear pequenos objetos', value: yn(a.mobility.reachGrip.cannotHandleSmallObjects) },
      { number: '14', text: 'Condições de capacidade aeróbica/muscular', value: yn(a.mobility.aerobicMuscular.hasCondition) },
      { number: '15', text: 'Dificuldade de caminhar que impede atividade', value: yn(a.mobility.gait.difficultyImpairsActivity) },
      { number: '16', text: 'Duas ou mais quedas no último ano', value: yn(a.mobility.gait.twoOrMoreFallsLastYear) },
      { number: '17', text: 'Perda de urina ou fezes sem querer', value: yn(a.mobility.continence.involuntaryLossOfUrineOrFeces) },
      { number: '18', text: 'Problema de visão que impede atividade', value: yn(a.communication.visionImpairsActivity) },
      { number: '19', text: 'Problema de audição que impede atividade', value: yn(a.communication.hearingImpairsActivity) },
      { number: '20', text: 'Comorbidade múltipla', value: yn(a.multipleComorbidity.hasCondition) },
    ];
  }
}
