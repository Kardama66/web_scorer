import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing.page';
import { ResultsPageComponent } from './pages/results.page';
import { NotFoundPageComponent } from './pages/not-found.page';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'r/:id', component: ResultsPageComponent },
  { path: '**', component: NotFoundPageComponent }
];
