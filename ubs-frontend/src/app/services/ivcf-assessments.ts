import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IvcfAnswers {
  age: '60_74' | '75_84' | '85_plus';
  healthPerception: 'good' | 'regular_bad';

  avdInstrumental: {
    stoppedShopping: boolean;
    stoppedManagingMoney: boolean;
    stoppedHousework: boolean;
  };

  avdBasica: {
    stoppedBathingAlone: boolean;
  };

  cognition: {
    familyNoticedForgetfulness: boolean;
    forgetfulnessWorsening: boolean;
    forgetfulnessImpairsActivity: boolean;
  };

  humor: {
    discouragementSadnessHopelessness: boolean;
    lossOfInterestOrPleasure: boolean;
  };

  mobility: {
    reachGrip: {
      cannotRaiseArmsAboveShoulder: boolean;
      cannotHandleSmallObjects: boolean;
    };
    aerobicMuscular: {
      hasCondition: boolean;
      unintentionalWeightLoss: boolean;
      lowBmi: boolean;
      smallCalfCircumference: boolean;
      slowGaitSpeed: boolean;
    };
    gait: {
      difficultyImpairsActivity: boolean;
      twoOrMoreFallsLastYear: boolean;
    };
    continence: {
      involuntaryLossOfUrineOrFeces: boolean;
    };
  };

  communication: {
    visionImpairsActivity: boolean;
    hearingImpairsActivity: boolean;
  };

  multipleComorbidity: {
    hasCondition: boolean;
    fiveOrMoreChronicDiseases: boolean;
    fiveOrMoreDailyMedications: boolean;
    recentHospitalization: boolean;
  };
}

export interface IvcfScoreBreakdown {
  age: number;
  healthPerception: number;
  avdInstrumental: number;
  avdBasica: number;
  cognition: number;
  humor: number;
  reachGrip: number;
  aerobicMuscular: number;
  gait: number;
  continence: number;
  vision: number;
  hearing: number;
  multipleComorbidity: number;
}

export type IvcfClassification = 'baixa' | 'moderada' | 'alta';

export interface IvcfAssessment {
  id: string;
  patientId: string;
  professionalId: string;
  assessedAt: string;
  answers: IvcfAnswers;
  totalScore: number;
  scoreBreakdown: IvcfScoreBreakdown;
  classification: IvcfClassification;
  createdAt: string;
}

export interface CreateIvcfAssessmentInput {
  patientId: string;
  assessedAt: string;
  answers: IvcfAnswers;
}

@Injectable({
  providedIn: 'root',
})
export class IvcfAssessments {
  private readonly apiUrl = `${environment.apiUrl}/ivcf-assessments`;

  constructor(private http: HttpClient) {}

  create(input: CreateIvcfAssessmentInput): Observable<IvcfAssessment> {
    return this.http.post<IvcfAssessment>(this.apiUrl, input);
  }

  listByPatient(patientId: string): Observable<IvcfAssessment[]> {
    return this.http.get<IvcfAssessment[]>(this.apiUrl, { params: { patientId } });
  }

  getById(id: string): Observable<IvcfAssessment> {
    return this.http.get<IvcfAssessment>(`${this.apiUrl}/${id}`);
  }
}
