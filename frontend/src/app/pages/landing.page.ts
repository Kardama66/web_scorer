import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { UrlInputCardComponent } from '../components/url-input-card.component';
import { AuditService } from '../services/audit.service';
import { ScoreRingComponent } from '../components/score-ring.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [UrlInputCardComponent, ScoreRingComponent, NgFor, NgIf, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Website audit demo SaaS</p>
        <h1>Score your website in under a minute.</h1>
        <p class="lead">
          Lighthouse-backed insights, practical UX checks, and shareable reports built for modern
          growth teams.
        </p>
        <app-url-input-card
          [disabled]="auditService.loading()"
          (analyze)="handleAnalyze($event)"
        ></app-url-input-card>
        <p class="input-error" *ngIf="auditService.error()">{{ auditService.error() }}</p>
      </div>
      <div class="hero-panel">
        <div class="hero-card">
          <div class="hero-score">92</div>
          <div>
            <strong>Optimization snapshot</strong>
            <p class="muted">Performance, SEO, UX, and CTA readiness at a glance.</p>
          </div>
        </div>
        <div class="hero-screens">
          <div class="screen-placeholder"></div>
          <div class="screen-placeholder tall"></div>
        </div>
      </div>
    </section>

    <section class="feature-grid">
      <div class="feature-card" *ngFor="let feature of features">
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.body }}</p>
      </div>
    </section>

    <section class="result-preview" *ngIf="auditService.current() as result">
      <div class="card result-summary">
        <div>
          <p class="eyebrow">Latest audit</p>
          <h2>{{ result.url }}</h2>
          <p class="muted">Final score</p>
        </div>
        <app-score-ring [score]="result.score"></app-score-ring>
      </div>
      <div class="card result-categories">
        <h3>Category scores</h3>
        <div class="pill-grid">
          <div class="pill" *ngFor="let category of result.categories">
            <span>{{ category.title }}</span>
            <strong>{{ category.score }}</strong>
          </div>
        </div>
        <a class="btn-primary" [routerLink]="['/r', result.id]">View full report</a>
      </div>
    </section>
  `
})
export class LandingPageComponent {
  features = [
    { title: 'Lighthouse + heuristics', body: 'Blend lab metrics with real UX signals.' },
    { title: 'Security-aware', body: 'Blocks private IPs and scans HTTPS readiness.' },
    { title: 'Shareable results', body: 'Generate a link to keep teams aligned.' }
  ];

  constructor(public auditService: AuditService) {}

  async handleAnalyze(url: string): Promise<void> {
    await this.auditService.runAudit(url);
  }
}
