import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { DevStatusComponent } from './pages/dev-status/dev-status.component';
import { PersonalReportComponent } from './pages/personal-report/personal-report.component';

export const appRoutes: Routes = [
  { path: 'homepage', component: HomepageComponent },
  { path: 'dev-status', component: DevStatusComponent },
  { path: 'personal-report', component: PersonalReportComponent },
  { path: '', redirectTo: '/homepage', pathMatch: 'full' },
  { path: '**', redirectTo: '/homepage' },
];
