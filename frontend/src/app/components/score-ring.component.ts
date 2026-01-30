import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-score-ring',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div class="score-ring" [ngStyle]="{ '--score': clampedScore }" aria-label="Overall score">
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="scoreGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" />
            <stop offset="100%" stop-color="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle class="ring-bg" cx="60" cy="60" r="48" />
        <circle class="ring-progress" cx="60" cy="60" r="48" />
      </svg>
      <div class="score-meta">
        <strong>{{ clampedScore }}</strong>
        <span>Overall score</span>
      </div>
    </div>
  `
})
export class ScoreRingComponent {
  @Input({ required: true }) score = 0;

  get clampedScore(): number {
    return Math.max(0, Math.min(100, Math.round(this.score)));
  }
}
