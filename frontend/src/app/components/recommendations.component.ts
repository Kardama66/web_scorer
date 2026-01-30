import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <section class="card recommendations">
      <header class="category-header">
        <h3>Recommendations</h3>
      </header>
      <ul *ngIf="recommendations?.length; else empty" class="recommendation-list">
        <li *ngFor="let item of recommendations">{{ item }}</li>
      </ul>
      <ng-template #empty>
        <p class="muted">No major issues detected. Keep monitoring performance and SEO trends.</p>
      </ng-template>
    </section>
  `
})
export class RecommendationsComponent {
  @Input() recommendations: string[] = [];
}
