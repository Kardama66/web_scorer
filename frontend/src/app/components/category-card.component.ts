import { Component, Input } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { AuditCategory } from '../../../../shared/types';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [NgFor, NgClass, NgIf],
  template: `
    <section class="card category-card">
      <header class="category-header">
        <div>
          <h3>{{ category.title }}</h3>
          <p class="muted">Weight {{ category.weight }}%</p>
        </div>
        <span class="category-score">{{ category.score }}</span>
      </header>
      <ul class="check-list">
        <li *ngFor="let check of category.checks" [ngClass]="'status-' + check.status">
          <span class="status-indicator"></span>
          <div>
            <strong>{{ check.title }}</strong>
            <p *ngIf="check.description">{{ check.description }}</p>
          </div>
        </li>
      </ul>
    </section>
  `
})
export class CategoryCardComponent {
  @Input({ required: true }) category!: AuditCategory;
}
