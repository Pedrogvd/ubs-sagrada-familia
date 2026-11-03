import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Visit {
  id: string;
  patientId: string;
  professionalId: string;
  visitDate: string;
  outcome: 'completed' | 'patient_absent' | 'refused';
  bloodPressure: string;
  weightKg: number | null;
  bloodGlucoseMgDl: number | null;
  needsReferral: boolean;
  referredTo: string;
  notes: string;
}

export interface CreateVisitInput {
  patientId: string;
  visitDate: string;
  outcome: 'completed' | 'patient_absent' | 'refused';
  bloodPressure: string;
  weightKg: number | null;
  bloodGlucoseMgDl: number | null;
  needsReferral: boolean;
  referredTo: string;
  notes: string;
}

@Injectable({
  providedIn: 'root',
})
export class Visits {
  private readonly apiUrl = `${environment.apiUrl}/visits`;

  constructor(private http: HttpClient) {}

  list(): Observable<Visit[]> {
    return this.http.get<Visit[]>(this.apiUrl);
  }

  listByPatient(patientId: string): Observable<Visit[]> {
    return this.http.get<Visit[]>(this.apiUrl, { params: { patientId } });
  }

  create(input: CreateVisitInput): Observable<Visit> {
    return this.http.post<Visit>(this.apiUrl, input);
  }
}