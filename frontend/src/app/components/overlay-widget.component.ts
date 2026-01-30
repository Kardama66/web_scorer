import { Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';
import { AuditResult } from '../../../../shared/types';
import { ScoreRingComponent } from './score-ring.component';

@Component({
  selector: 'app-overlay-widget',
  standalone: true,
  imports: [NgFor, ScoreRingComponent],
  template: `
    <div class="overlay-shell">
      <div class="overlay-widget">
        <header>
          <span class="eyebrow">Website score</span>
          <h3>{{ audit.url }}</h3>
        </header>
        <app-score-ring [score]="audit.score"></app-score-ring>
        <ul class="overlay-categories">
          <li *ngFor="let category of audit.categories">
            <span>{{ category.title }}</span>
            <strong>{{ category.score }}</strong>
          </li>
        </ul>
        <a class="btn-ghost overlay-link" [href]="fullReportLink" target="_blank" rel="noopener">
          View full report
        </a>
        <p class="overlay-footer">Powered by SitePulse</p>
      </div>
    </div>
  `
})
export class OverlayWidgetComponent {
  @Input({ required: true }) audit!: AuditResult;

  get fullReportLink(): string {
    return `${window.location.origin}/r/${this.audit.id}`;
  }
}
