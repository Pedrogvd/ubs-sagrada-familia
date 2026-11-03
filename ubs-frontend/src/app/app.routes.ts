import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Patients } from './pages/patients/patients';
import { PatientForm } from './pages/patient-form/patient-form';
import { VisitForm } from './pages/visit-form/visit-form';
import { VisitsNeeded } from './pages/visits-needed/visits-needed';
import { VisitsCalendar } from './pages/visits-calendar/visits-calendar';
import { Settings } from './pages/settings/settings';
import { ProfessionalForm } from './pages/professional-form/professional-form';
import { Login } from './pages/login/login';
import { IvcfForm } from './pages/ivcf-form/ivcf-form';
import { IvcfHistory } from './pages/ivcf-history/ivcf-history';
import { VisitHistory } from './pages/visit-history/visit-history';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', component: Dashboard, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: 'patients', component: Patients, canActivate: [authGuard] },
  { path: 'patients/new', component: PatientForm, canActivate: [authGuard] },
  { path: 'patients/edit/:id', component: PatientForm, canActivate: [authGuard] },
  { path: 'visits-needed', component: VisitsNeeded, canActivate: [authGuard] },
  { path: 'visits-calendar', component: VisitsCalendar, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard, adminGuard] },
  { path: 'professionals/new', component: ProfessionalForm, canActivate: [authGuard, adminGuard] },
  { path: 'professionals/edit/:id', component: ProfessionalForm, canActivate: [authGuard, adminGuard] },
  { path: 'visits/new/:patientId', component: VisitForm, canActivate: [authGuard] },
  { path: 'ivcf/new/:patientId', component: IvcfForm, canActivate: [authGuard] },
  { path: 'ivcf/history/:patientId', component: IvcfHistory, canActivate: [authGuard] },
  { path: 'visits/history/:patientId', component: VisitHistory, canActivate: [authGuard] },
];