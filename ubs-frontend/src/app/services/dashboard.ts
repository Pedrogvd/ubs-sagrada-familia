import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardSummary {
  overdueVisits: number;
  upcomingVisits7Days: number;
  visitsThisMonth: number;
  patientsTracked: number;
  patientsWithoutVisit30Days: number;
}

@Injectable({
  providedIn: 'root'
})

export class Dashboard {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }
  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.apiUrl);
  }
}