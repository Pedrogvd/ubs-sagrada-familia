import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VisitOutcomeBreakdown {
  completed: number;
  patient_absent: number;
  refused: number;
  total: number;
  successRate: number;
}

export interface AcsRanking {
  professionalId: string;
  professionalName: string;
  visitsCount: number;
}

export interface ConditionBreakdown {
  condition: string;
  patientsVisited: number;
}

export interface MonthlyReport {
  month: string;
  visitOutcomes: VisitOutcomeBreakdown;
  acsRanking: AcsRanking[];
  conditionBreakdown: ConditionBreakdown[];
  newPatientsCount: number;
}

@Injectable({ providedIn: 'root' })
export class Reports {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getMonthly(month: string): Observable<MonthlyReport> {
    return this.http.get<MonthlyReport>(`${this.apiUrl}/monthly`, { params: { month } });
  }
}